const OpenAI = require('openai');
const config = require('../config/config');

// Hebrew unicode range. If the text contains at least one Hebrew letter we
// treat it as Hebrew content that must be translated before the (English-only)
// anxiety classifier can read it.
const HEBREW_REGEX = /[\u0590-\u05FF]/;

let cachedClient = null;

function getClient() {
  if (!config.OPENAI_API_KEY) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  }
  return cachedClient;
}

function containsHebrew(text) {
  return typeof text === 'string' && HEBREW_REGEX.test(text);
}

async function translateToEnglish(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return text;
  }

  if (!containsHebrew(text)) {
    return text;
  }

  const client = getClient();
  if (!client) {
    console.warn(
      'translationService: OPENAI_API_KEY missing, sending Hebrew text untranslated.',
    );
    return text;
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content:
            'You are a translation engine. Translate the user message from Hebrew to natural, fluent English. Preserve the original emotional tone and first-person voice. Do NOT add explanations, quotes, prefixes, suffixes, or any commentary. Output ONLY the translated English text.',
        },
        { role: 'user', content: text },
      ],
    });

    const translated = completion.choices?.[0]?.message?.content?.trim();
    if (!translated) {
      console.warn('translationService: empty translation, using original text.');
      return text;
    }
    return translated;
  } catch (error) {
    console.error('translationService: translation failed:', error.message);
    return text;
  }
}

module.exports = {
  translateToEnglish,
  containsHebrew,
};
