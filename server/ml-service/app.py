import os
import json
import numpy as np
from flask import Flask, request, jsonify
import tensorflow as tf
from tensorflow.keras.preprocessing.text import tokenizer_from_json
from tensorflow.keras.preprocessing.sequence import pad_sequences

app = Flask(__name__)

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets')
MODEL_PATH = os.path.join(ASSETS_DIR, 'neshama_v4_final.keras')
TOKENIZER_PATH = os.path.join(ASSETS_DIR, 'tokenizer (1).json')

MAX_SEQUENCE_LENGTH = 200

model = None
tokenizer = None


def load_model_and_tokenizer():
    global model, tokenizer

    print(f"Loading Keras model from {MODEL_PATH} ...")
    model = tf.keras.models.load_model(MODEL_PATH, compile=False)
    print("Model loaded successfully (compile=False, inference only).")

    # Inspect the model to determine expected input length
    input_shape = model.input_shape
    print(f"Model input shape: {input_shape}")
    global MAX_SEQUENCE_LENGTH
    if input_shape and len(input_shape) >= 2 and input_shape[1] is not None:
        MAX_SEQUENCE_LENGTH = input_shape[1]
        print(f"Using sequence length from model: {MAX_SEQUENCE_LENGTH}")

    output_shape = model.output_shape
    print(f"Model output shape: {output_shape}")
    model.summary()

    print(f"Loading tokenizer from {TOKENIZER_PATH} ...")
    with open(TOKENIZER_PATH, 'r', encoding='utf-8') as f:
        tokenizer_json = f.read()
    tokenizer = tokenizer_from_json(tokenizer_json)
    print(f"Tokenizer loaded. Vocabulary size: {len(tokenizer.word_index)}")

    # Run a quick test to understand the output format
    test_seq = tokenizer.texts_to_sequences(["I feel happy and great today"])
    test_pad = pad_sequences(test_seq, maxlen=MAX_SEQUENCE_LENGTH, padding='post', truncating='post')
    test_pred = model.predict(test_pad, verbose=0)
    print(f"Test prediction (positive text): {test_pred}")

    test_seq2 = tokenizer.texts_to_sequences(["I am very anxious and scared and worried about everything"])
    test_pad2 = pad_sequences(test_seq2, maxlen=MAX_SEQUENCE_LENGTH, padding='post', truncating='post')
    test_pred2 = model.predict(test_pad2, verbose=0)
    print(f"Test prediction (anxious text): {test_pred2}")


def classify_text(text):
    if model is None or tokenizer is None:
        load_model_and_tokenizer()

    print(f"\n{'='*60}")
    print(f"INPUT TEXT: {text}")
    print(f"{'='*60}")

    sequences = tokenizer.texts_to_sequences([text])
    num_known = sum(1 for token in sequences[0] if token != 0)
    num_words = len(text.split())
    print(f"Tokenization: {num_words} words -> {num_known} known tokens (out of {len(sequences[0])} total)")

    padded = pad_sequences(sequences, maxlen=MAX_SEQUENCE_LENGTH, padding='post', truncating='post')
    prediction = model.predict(padded, verbose=0)
    output = prediction[0]

    # The Neshama V4 model was trained as:
    #   0 = normal, 1 = anxiety, 2 = depression
    label_map = {0: 'normal', 1: 'anxiety', 2: 'depression'}
    class_idx = int(np.argmax(output))
    confidence = float(output[class_idx])
    label = label_map.get(class_idx, 'unknown')

    probabilities = {
        'normal': float(output[0]),
        'anxiety': float(output[1]),
        'depression': float(output[2]),
    }

    print("\nPROBABILITIES:")
    for i, prob in enumerate(output):
        class_name = label_map.get(i, f'class_{i}')
        marker = " <-- CHOSEN" if i == class_idx else ""
        print(f"  {class_name:>10}: {float(prob):.6f} ({float(prob)*100:.2f}%){marker}")

    print(f"\nRESULT: {label} (confidence={confidence:.4f})")
    print(f"{'='*60}\n")

    return label, confidence, probabilities


@app.route('/classify', methods=['POST'])
def classify_endpoint():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing "text" field'}), 400

    if not isinstance(data['text'], str):
        return jsonify({'error': 'Text must be a string'}), 400

    text = data['text'].strip()
    if not text:
        return jsonify({'error': 'Empty text'}), 400

    try:
        category, confidence, probabilities = classify_text(text)

        return jsonify({
            'category': category,
            'confidence': round(confidence, 4),
            'probabilities': probabilities,
            # Backwards compatibility for any old client still reading this key.
            'predicted_class': category,
            'probabilities_breakdown': probabilities,
        })
    except Exception as e:
        print(f"Classification error: {e}")
        return jsonify({'error': 'Classification failed'}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model_loaded': model is not None})


@app.route('/warmup', methods=['GET'])
def warmup():
    if model is None or tokenizer is None:
        load_model_and_tokenizer()

    return jsonify({'status': 'ok', 'model_loaded': True})


@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'status': 'ok',
        'service': 'neshama-ml-service',
        'health': '/health',
        'classify': '/classify',
    })


if __name__ == '__main__':
    load_model_and_tokenizer()
    app.run(host='0.0.0.0', port=5001, debug=False)