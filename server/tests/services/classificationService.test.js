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
});
