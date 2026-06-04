"""
Shared pytest fixtures for the Neshama ML-service test suite.

The real TensorFlow model (neshama_v4_final.keras) is NEVER loaded during
tests.  All ML dependencies are replaced with lightweight MagicMock objects so
the suite runs fast and requires no GPU / large RAM.

Fixture hierarchy
-----------------
mock_model          – fake Keras model (3-class, low/moderate/high)
mock_tokenizer      – fake Keras tokenizer
client              – Flask test client with mocks injected, yields
                      (test_client, mock_model, mock_tokenizer)

Convenience prediction fixtures
--------------------------------
low_anxiety_prediction      – np.array([[0.80, 0.15, 0.05]])
moderate_anxiety_prediction – np.array([[0.20, 0.60, 0.20]])
high_anxiety_prediction     – np.array([[0.05, 0.15, 0.80]])
"""

import sys
import os
import json

import numpy as np
import pytest
from unittest.mock import MagicMock, patch

# Make the ml-service package root importable from any test file.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ---------------------------------------------------------------------------
# Low-level ML mocks
# ---------------------------------------------------------------------------


@pytest.fixture
def mock_model():
    """A MagicMock that mimics a compiled 3-class Keras model.

    Default prediction: class-0 wins  →  low anxiety
    Shape: input=(None, 200), output=(None, 3)
    """
    model = MagicMock()
    model.input_shape = (None, 200)
    model.output_shape = (None, 3)
    model.summary = MagicMock(return_value=None)
    # class 0 (low) wins by default
    model.predict = MagicMock(return_value=np.array([[0.80, 0.15, 0.05]]))
    return model


@pytest.fixture
def mock_tokenizer():
    """A MagicMock that mimics a fitted Keras Tokenizer.

    word_index contains a small representative vocabulary.
    texts_to_sequences always returns a minimal valid sequence.
    """
    tokenizer = MagicMock()
    tokenizer.word_index = {
        "i": 1, "feel": 2, "happy": 3,
        "anxious": 4, "calm": 5, "worried": 6,
    }
    tokenizer.texts_to_sequences = MagicMock(return_value=[[1, 2, 3]])
    return tokenizer


# ---------------------------------------------------------------------------
# Flask test client – model is NEVER loaded from disk
# ---------------------------------------------------------------------------


@pytest.fixture
def client(mock_model, mock_tokenizer):
    """Patch all TensorFlow imports, inject mocks, yield Flask test client.

    Yields
    ------
    tuple[FlaskClient, MagicMock, MagicMock]
        (test_client, mock_model, mock_tokenizer)
        The model / tokenizer mocks are yielded so individual tests can
        override ``predict`` return values via ``mock_model.predict.return_value``.
    """
    mock_tf = MagicMock()
    mock_tf.keras.models.load_model.side_effect = AssertionError(
        "load_model() must never be called in tests; use mock_model fixture instead."
    )
    mock_tf.keras.preprocessing.sequence.pad_sequences = MagicMock(
        return_value=np.array([[1, 2, 3] + [0] * 197])
    )

    tf_patches = {
        "tensorflow": mock_tf,
        "tensorflow.keras": mock_tf.keras,
        "tensorflow.keras.preprocessing": mock_tf.keras.preprocessing,
        "tensorflow.keras.preprocessing.text": MagicMock(
            tokenizer_from_json=MagicMock(return_value=mock_tokenizer)
        ),
        "tensorflow.keras.preprocessing.sequence": MagicMock(
            pad_sequences=mock_tf.keras.preprocessing.sequence.pad_sequences
        ),
    }

    with patch.dict("sys.modules", tf_patches):
        # Always import a fresh copy so the module-level globals get our mocks.
        sys.modules.pop("app", None)

        import app as flask_app  # noqa: PLC0415

        flask_app.model = mock_model
        flask_app.tokenizer = mock_tokenizer
        flask_app.MAX_SEQUENCE_LENGTH = 200

        flask_app.app.config["TESTING"] = True

        with flask_app.app.test_client() as tc:
            yield tc, mock_model, mock_tokenizer


# ---------------------------------------------------------------------------
# Prediction shape convenience fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def low_anxiety_prediction():
    """3-class softmax output where class 0 (low) wins."""
    return np.array([[0.80, 0.15, 0.05]])


@pytest.fixture
def moderate_anxiety_prediction():
    """3-class softmax output where class 1 (moderate) wins."""
    return np.array([[0.20, 0.60, 0.20]])


@pytest.fixture
def high_anxiety_prediction():
    """3-class softmax output where class 2 (high) wins."""
    return np.array([[0.05, 0.15, 0.80]])


# ---------------------------------------------------------------------------
# Request body helpers
# ---------------------------------------------------------------------------


@pytest.fixture
def valid_classify_payload():
    """Minimal valid POST body for the /classify endpoint."""
    return {"text": "I feel calm and relaxed today"}


@pytest.fixture
def hebrew_classify_payload():
    """Valid POST body with Hebrew RTL text."""
    return {"text": "אני מרגיש חרדה גדולה ולא יכול לישון"}


@pytest.fixture
def long_text_classify_payload():
    """POST body whose token count well exceeds MAX_SEQUENCE_LENGTH (200).

    The model's pad_sequences should truncate it silently.
    """
    words = ["worry"] * 300  # 300 tokens > 200 max
    return {"text": " ".join(words)}
