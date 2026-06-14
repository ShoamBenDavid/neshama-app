const config = require('../config/config');
const { translateToEnglish, containsHebrew } = require('./translationService');

async function classify(content) {
  try {
    // The classifier was trained on English text. If the journal entry
    // contains Hebrew we translate it first so the tokenizer sees the language
    // it was trained on.
    let textForModel = content;
    if (containsHebrew(content)) {
      textForModel = await translateToEnglish(content);
    }

    const response = await fetch(`${config.ML_SERVICE_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textForModel }),
    });

    if (!response.ok) {
      throw new Error(`ML service responded with ${response.status}`);
    }

    const result = await response.json();
    const rawCategory = result.category || result.predicted_class;
    const category = String(rawCategory || '').trim().toLowerCase();
    const probabilities =
      result.probabilities || result.probabilities_breakdown || {};
    const normalizedProbabilities = {
      normal: Number(probabilities.normal ?? probabilities.Normal ?? 0),
      anxiety: Number(probabilities.anxiety ?? probabilities.Anxiety ?? 0),
      depression: Number(probabilities.depression ?? probabilities.Depression ?? 0),
    };
    const confidence = Number(result.confidence ?? 0);

    return {
      classification: {
        category,
        probabilities: normalizedProbabilities,
        confidence,
        modelVersion: 'neshama_v4_final',
        classifiedAt: new Date(),
      },
      // Legacy field kept only for old charts that still read anxietyLevel.
      anxietyLevel: normalizedProbabilities.anxiety,
      anxietyLabel: null,
    };
  } catch (error) {
    console.error('Classification failed:', error.message);
    return null;
  }
}

module.exports = { classify };
