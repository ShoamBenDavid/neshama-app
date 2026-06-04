const config = require('../config/config');
const { translateToEnglish, containsHebrew } = require('./translationService');

async function classify(content) {
  try {
    // The anxiety classifier was trained on English text only. If the journal
    // entry contains Hebrew we must translate it to English first, otherwise
    // the tokenizer maps every Hebrew word to <UNK> and the prediction is
    // meaningless.
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

    return {
      anxietyLevel: result.anxiety_level,
      anxietyLabel: result.anxiety_label,
    };
  } catch (error) {
    console.error('Classification failed:', error.message);
    return null;
  }
}

module.exports = { classify };
