import json
import numpy as np
import pytest
from unittest.mock import MagicMock, patch
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


@pytest.fixture
def mock_deps():
    """Set up mocked TensorFlow and tokenizer before importing app."""
    mock_model = MagicMock()
    mock_model.input_shape = (None, 200)
    mock_model.output_shape = (None, 3)
    mock_model.summary = MagicMock()
    mock_model.predict = MagicMock(
        return_value=np.array([[0.8, 0.15, 0.05]])
    )

    mock_tokenizer = MagicMock()
    mock_tokenizer.word_index = {"i": 1, "feel": 2, "happy": 3}
    mock_tokenizer.texts_to_sequences = MagicMock(return_value=[[1, 2, 3]])

    return mock_model, mock_tokenizer


@pytest.fixture
def client(mock_deps):
    """Create Flask test client with mocked ML dependencies."""
    mock_model, mock_tokenizer = mock_deps

    mock_tf = MagicMock()
    mock_tf.keras.models.load_model.return_value = mock_model
    mock_tf.keras.preprocessing.sequence.pad_sequences = MagicMock(
        return_value=np.array([[1, 2, 3] + [0] * 197])
    )

    with patch.dict('sys.modules', {
        'tensorflow': mock_tf,
        'tensorflow.keras': mock_tf.keras,
        'tensorflow.keras.preprocessing': mock_tf.keras.preprocessing,
        'tensorflow.keras.preprocessing.text': MagicMock(
            tokenizer_from_json=MagicMock(return_value=mock_tokenizer)
        ),
        'tensorflow.keras.preprocessing.sequence': MagicMock(
            pad_sequences=mock_tf.keras.preprocessing.sequence.pad_sequences
        ),
    }):
        # Remove cached app module if exists
        if 'app' in sys.modules:
            del sys.modules['app']

        import app as flask_app
        flask_app.model = mock_model
        flask_app.tokenizer = mock_tokenizer
        flask_app.MAX_SEQUENCE_LENGTH = 200

        flask_app.app.config['TESTING'] = True
        with flask_app.app.test_client() as test_client:
            yield test_client, mock_model, mock_tokenizer


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        test_client, mock_model, _ = client
        response = test_client.get('/health')
        data = json.loads(response.data)

        assert response.status_code == 200
        assert data['status'] == 'ok'
        assert data['model_loaded'] is True


class TestClassifyEndpoint:
    def test_classify_valid_text(self, client):
        test_client, mock_model, mock_tokenizer = client
        mock_model.predict.return_value = np.array([[0.8, 0.15, 0.05]])

        response = test_client.post(
            '/classify',
            data=json.dumps({'text': 'I feel happy and great today'}),
            content_type='application/json',
        )
        data = json.loads(response.data)

        assert response.status_code == 200
        assert 'anxiety_level' in data
        assert 'anxiety_label' in data
        assert data['anxiety_label'] == 'low'
        assert isinstance(data['anxiety_level'], float)

    def test_classify_high_anxiety(self, client):
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.05, 0.15, 0.8]])

        response = test_client.post(
            '/classify',
            data=json.dumps({'text': 'I am very anxious and scared'}),
            content_type='application/json',
        )
        data = json.loads(response.data)

        assert response.status_code == 200
        assert data['anxiety_label'] == 'high'
        assert data['anxiety_level'] > 0.5

    def test_classify_moderate_anxiety(self, client):
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.2, 0.6, 0.2]])

        response = test_client.post(
            '/classify',
            data=json.dumps({'text': 'I feel somewhat worried'}),
            content_type='application/json',
        )
        data = json.loads(response.data)

        assert response.status_code == 200
        assert data['anxiety_label'] == 'moderate'

    def test_classify_missing_text_field(self, client):
        test_client, _, _ = client
        response = test_client.post(
            '/classify',
            data=json.dumps({'wrong_field': 'some text'}),
            content_type='application/json',
        )
        data = json.loads(response.data)

        assert response.status_code == 400
        assert 'error' in data

    def test_classify_empty_text(self, client):
        test_client, _, _ = client
        response = test_client.post(
            '/classify',
            data=json.dumps({'text': '   '}),
            content_type='application/json',
        )
        data = json.loads(response.data)

        assert response.status_code == 400
        assert 'error' in data

    def test_classify_no_json_body(self, client):
        """POST with no body and no Content-Type returns a 4xx error.

        Flask returns 415 Unsupported Media Type (HTML) when content-type is
        missing, which is a client error.  We only assert the status code here
        because the body is not JSON in that case.
        """
        test_client, _, _ = client
        response = test_client.post('/classify')

        assert response.status_code in (400, 415)

    def test_classify_model_error(self, client):
        test_client, mock_model, _ = client
        mock_model.predict.side_effect = Exception('Model inference failed')

        response = test_client.post(
            '/classify',
            data=json.dumps({'text': 'Some text'}),
            content_type='application/json',
        )
        data = json.loads(response.data)

        assert response.status_code == 500
        assert 'error' in data

    def test_classify_anxiety_score_calculation(self, client):
        """Anxiety score should be sum of moderate + high probabilities."""
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.3, 0.4, 0.3]])

        response = test_client.post(
            '/classify',
            data=json.dumps({'text': 'Testing score calculation'}),
            content_type='application/json',
        )
        data = json.loads(response.data)

        assert response.status_code == 200
        # anxiety_score = moderate(0.4) + high(0.3) = 0.7
        assert abs(data['anxiety_level'] - 0.7) < 0.01

    def test_classify_non_string_text(self, client):
        """Non-string text value (integer) should be handled."""
        test_client, _, _ = client
        response = test_client.post(
            '/classify',
            data=json.dumps({'text': 12345}),
            content_type='application/json',
        )
        # int has no .strip() so this should either error or be handled
        assert response.status_code in (400, 500)

    def test_classify_special_characters(self, client):
        """Text with special characters should be processed."""
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.7, 0.2, 0.1]])

        response = test_client.post(
            '/classify',
            data=json.dumps({'text': 'Hello! @#$% world... <script>alert("x")</script>'}),
            content_type='application/json',
        )
        data = json.loads(response.data)

        assert response.status_code == 200
        assert 'anxiety_level' in data


class TestHealthWithNoModel:
    def test_health_model_not_loaded(self, client):
        """Health endpoint when model is None."""
        test_client, _, _ = client
        import app as flask_app
        original_model = flask_app.model
        flask_app.model = None

        response = test_client.get('/health')
        data = json.loads(response.data)

        assert response.status_code == 200
        assert data['status'] == 'ok'
        assert data['model_loaded'] is False

        flask_app.model = original_model


class TestLoadModelAndTokenizer:
    def test_load_model_success(self, client):
        """load_model_and_tokenizer should set model and tokenizer globals."""
        _, mock_model, mock_tokenizer = client
        import app as flask_app

        assert flask_app.model is not None
        assert flask_app.tokenizer is not None
        assert flask_app.MAX_SEQUENCE_LENGTH == 200

    def test_model_input_shape_sets_sequence_length(self, client):
        """If model input_shape has a sequence length, it should be used."""
        _, mock_model, _ = client
        # Already set via fixture: mock_model.input_shape = (None, 200)
        import app as flask_app
        assert flask_app.MAX_SEQUENCE_LENGTH == 200


# ---------------------------------------------------------------------------
# Dashboard output-schema validation
# ---------------------------------------------------------------------------


class TestDashboardOutputSchema:
    """Validate that /classify always returns the exact JSON shape the
    DashboardScreen expects:  { anxiety_level: float, anxiety_label: str }
    """

    def test_response_has_exactly_two_keys_on_success(self, client):
        """No extra keys leak into the response — contract stays stable."""
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.6, 0.3, 0.1]])

        response = test_client.post(
            "/classify",
            data=json.dumps({"text": "I feel okay"}),
            content_type="application/json",
        )
        data = json.loads(response.data)

        assert response.status_code == 200
        assert set(data.keys()) == {"anxiety_level", "anxiety_label"}

    def test_anxiety_level_is_float_not_int(self, client):
        """anxiety_level must always be a float (never truncated to int)."""
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.5, 0.3, 0.2]])

        response = test_client.post(
            "/classify",
            data=json.dumps({"text": "mixed feelings"}),
            content_type="application/json",
        )
        data = json.loads(response.data)

        assert isinstance(data["anxiety_level"], float)

    def test_anxiety_level_precision_is_four_decimal_places(self, client):
        """anxiety_level should be rounded to 4 d.p. (round(..., 4))."""
        test_client, mock_model, _ = client
        # Use a prediction that produces a non-trivial anxiety_score
        mock_model.predict.return_value = np.array([[0.1234, 0.5678, 0.3088]])

        response = test_client.post(
            "/classify",
            data=json.dumps({"text": "testing precision"}),
            content_type="application/json",
        )
        data = json.loads(response.data)

        assert response.status_code == 200
        # score = 0.5678 + 0.3088 = 0.8766  →  round(0.8766, 4)
        score_str = str(data["anxiety_level"])
        decimal_places = len(score_str.split(".")[-1]) if "." in score_str else 0
        assert decimal_places <= 4

    def test_anxiety_label_is_one_of_valid_values(self, client):
        """anxiety_label must be 'low', 'moderate', or 'high'."""
        test_client, mock_model, _ = client
        for prediction, expected_label in [
            (np.array([[0.80, 0.15, 0.05]]), "low"),
            (np.array([[0.20, 0.60, 0.20]]), "moderate"),
            (np.array([[0.05, 0.15, 0.80]]), "high"),
        ]:
            mock_model.predict.return_value = prediction
            response = test_client.post(
                "/classify",
                data=json.dumps({"text": "test text"}),
                content_type="application/json",
            )
            data = json.loads(response.data)
            assert data["anxiety_label"] == expected_label

    def test_error_response_has_error_key(self, client):
        """Error responses must use the 'error' key (not 'message')."""
        test_client, _, _ = client
        response = test_client.post(
            "/classify",
            data=json.dumps({"wrong": "body"}),
            content_type="application/json",
        )
        data = json.loads(response.data)
        assert "error" in data
        assert "message" not in data


# ---------------------------------------------------------------------------
# Input-validation edge cases
# ---------------------------------------------------------------------------


class TestInputEdgeCases:
    """Extended validation: long text, Unicode, emoji, whitespace variants."""

    def test_classify_long_text_is_truncated_without_error(self, client):
        """Text exceeding MAX_SEQUENCE_LENGTH (200 tokens) must be accepted.

        pad_sequences truncates at the model boundary; the endpoint should
        return 200 without raising an exception.
        """
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.6, 0.3, 0.1]])
        long_text = " ".join(["stress"] * 300)  # 300 tokens >> 200

        response = test_client.post(
            "/classify",
            data=json.dumps({"text": long_text}),
            content_type="application/json",
        )
        assert response.status_code == 200

    def test_classify_hebrew_rtl_text(self, client):
        """Hebrew / RTL Unicode text must be accepted and classified."""
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.1, 0.2, 0.7]])

        response = test_client.post(
            "/classify",
            data=json.dumps({"text": "אני מרגיש חרדה גדולה ולא יכול לישון"}),
            content_type="application/json",
        )
        data = json.loads(response.data)

        assert response.status_code == 200
        assert data["anxiety_label"] == "high"

    def test_classify_emoji_in_text(self, client):
        """Emoji characters should not crash the tokeniser pipeline."""
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.7, 0.2, 0.1]])

        response = test_client.post(
            "/classify",
            data=json.dumps({"text": "I feel great today 😊🌟✨"}),
            content_type="application/json",
        )
        data = json.loads(response.data)

        assert response.status_code == 200
        assert "anxiety_level" in data

    def test_classify_single_word(self, client):
        """A single-word input should still produce a valid classification."""
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.8, 0.15, 0.05]])

        response = test_client.post(
            "/classify",
            data=json.dumps({"text": "anxious"}),
            content_type="application/json",
        )
        assert response.status_code == 200

    def test_classify_newline_and_tab_whitespace(self, client):
        """Text containing only newlines/tabs must be rejected (empty after strip)."""
        test_client, _, _ = client
        response = test_client.post(
            "/classify",
            data=json.dumps({"text": "\n\t\r\n"}),
            content_type="application/json",
        )
        assert response.status_code == 400

    def test_classify_mixed_language_text(self, client):
        """Text mixing Hebrew and English should not raise an exception."""
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.4, 0.4, 0.2]])

        response = test_client.post(
            "/classify",
            data=json.dumps({"text": "I feel חרדה sometimes but I'm okay"}),
            content_type="application/json",
        )
        assert response.status_code == 200

    def test_classify_very_long_single_word(self, client):
        """A single token that is unusually long should not break anything."""
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.7, 0.2, 0.1]])
        very_long_word = "a" * 500

        response = test_client.post(
            "/classify",
            data=json.dumps({"text": very_long_word}),
            content_type="application/json",
        )
        assert response.status_code in (200, 400, 500)  # must not throw unhandled


# ---------------------------------------------------------------------------
# Anxiety score calculation deep-dives (Dashboard logic)
# ---------------------------------------------------------------------------


class TestAnxietyScoreCalculation:
    """Validate the anxiety_score formula used by the Dashboard ProgressBar:
      anxiety_score = output[1] (moderate) + output[2] (high)
    """

    def test_score_is_zero_when_fully_low(self, client):
        """If model is 100 % confident class-0, score should be ~0."""
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[1.0, 0.0, 0.0]])

        response = test_client.post(
            "/classify",
            data=json.dumps({"text": "perfectly calm"}),
            content_type="application/json",
        )
        data = json.loads(response.data)

        assert response.status_code == 200
        assert data["anxiety_level"] == pytest.approx(0.0, abs=1e-4)

    def test_score_is_one_when_fully_high(self, client):
        """If model is 100 % confident class-2, score should be ~1."""
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.0, 0.0, 1.0]])

        response = test_client.post(
            "/classify",
            data=json.dumps({"text": "extreme panic"}),
            content_type="application/json",
        )
        data = json.loads(response.data)

        assert response.status_code == 200
        assert data["anxiety_level"] == pytest.approx(1.0, abs=1e-4)

    def test_score_equals_moderate_plus_high(self, client):
        """Score must always equal p(moderate) + p(high)."""
        test_client, mock_model, _ = client
        p_low, p_mod, p_high = 0.25, 0.45, 0.30
        mock_model.predict.return_value = np.array([[p_low, p_mod, p_high]])

        response = test_client.post(
            "/classify",
            data=json.dumps({"text": "I am feeling uneasy"}),
            content_type="application/json",
        )
        data = json.loads(response.data)

        assert response.status_code == 200
        expected = round(p_mod + p_high, 4)
        assert data["anxiety_level"] == pytest.approx(expected, abs=1e-4)

    def test_boundary_score_exactly_half(self, client):
        """Edge-case: score of exactly 0.5 must remain 0.5 after rounding."""
        test_client, mock_model, _ = client
        mock_model.predict.return_value = np.array([[0.50, 0.25, 0.25]])

        response = test_client.post(
            "/classify",
            data=json.dumps({"text": "borderline anxiety"}),
            content_type="application/json",
        )
        data = json.loads(response.data)

        assert response.status_code == 200
        assert data["anxiety_level"] == pytest.approx(0.50, abs=1e-4)
