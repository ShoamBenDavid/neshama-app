process.env.ML_SERVICE_URL = 'http://localhost:5001';
process.env.OPENAI_API_KEY = 'test-openai-key';

jest.mock('../../src/services/translationService', () => ({
  translateToEnglish: jest.fn(async (text) => text),
  containsHebrew: jest.requireActual('../../src/services/translationService')
    .containsHebrew,
}));

const { classify } = require('../../src/services/classificationService');
const translationService = require('../../src/services/translationService');

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  translationService.translateToEnglish.mockClear();
  translationService.translateToEnglish.mockImplementation(async (text) => text);
});

describe('classificationService', () => {
  it('should return classification on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          anxiety_level: 0.75,
          anxiety_label: 'high',
        }),
    });

    const result = await classify('I am very anxious and stressed');

    expect(result).toEqual({
      anxietyLevel: 0.75,
      anxietyLabel: 'high',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5001/classify',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should return null when ML service returns error status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await classify('Some text');

    expect(result).toBeNull();
  });

  it('should return null when ML service is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

    const result = await classify('Some text');

    expect(result).toBeNull();
  });

  it('should send correct request body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          anxiety_level: 0.2,
          anxiety_label: 'low',
        }),
    });

    await classify('I feel great today');

    const callArgs = global.fetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body).toEqual({ text: 'I feel great today' });
  });

  it('should return classification with low label', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          anxiety_level: 0.15,
          anxiety_label: 'low',
        }),
    });

    const result = await classify('I feel peaceful');
    expect(result.anxietyLabel).toBe('low');
    expect(result.anxietyLevel).toBe(0.15);
  });

  it('should return classification with moderate label', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          anxiety_level: 0.5,
          anxiety_label: 'moderate',
        }),
    });

    const result = await classify('I feel somewhat worried');
    expect(result.anxietyLabel).toBe('moderate');
    expect(result.anxietyLevel).toBe(0.5);
  });

  it('should return null for empty content', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
    });

    const result = await classify('');
    expect(result).toBeNull();
  });

  it('should return null when ML service returns malformed JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    const result = await classify('Some text');
    expect(result).toBeNull();
  });

  it('should NOT translate English text before classifying', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ anxiety_level: 0.2, anxiety_label: 'low' }),
    });

    await classify('I feel great today');

    expect(translationService.translateToEnglish).not.toHaveBeenCalled();
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toEqual({ text: 'I feel great today' });
  });

  it('should translate Hebrew text to English before classifying', async () => {
    translationService.translateToEnglish.mockResolvedValueOnce(
      'I feel great anxiety and cannot sleep',
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ anxiety_level: 0.9, anxiety_label: 'high' }),
    });

    const hebrew = 'אני מרגיש חרדה גדולה ולא יכול לישון';
    const result = await classify(hebrew);

    expect(translationService.translateToEnglish).toHaveBeenCalledWith(hebrew);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toEqual({ text: 'I feel great anxiety and cannot sleep' });
    expect(result).toEqual({ anxietyLevel: 0.9, anxietyLabel: 'high' });
  });

  it('should translate mixed Hebrew/English text before classifying', async () => {
    translationService.translateToEnglish.mockResolvedValueOnce(
      'I feel anxiety sometimes',
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ anxiety_level: 0.5, anxiety_label: 'moderate' }),
    });

    await classify("I feel חרדה sometimes");

    expect(translationService.translateToEnglish).toHaveBeenCalledTimes(1);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toEqual({ text: 'I feel anxiety sometimes' });
  });

  it('should still classify when translation falls back to original text', async () => {
    // translateToEnglish returns the original on OpenAI failure
    translationService.translateToEnglish.mockResolvedValueOnce(
      'אני מרגיש חרדה',
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ anxiety_level: 0.1, anxiety_label: 'low' }),
    });

    const result = await classify('אני מרגיש חרדה');

    expect(translationService.translateToEnglish).toHaveBeenCalled();
    expect(result).toEqual({ anxietyLevel: 0.1, anxietyLabel: 'low' });
  });
});
