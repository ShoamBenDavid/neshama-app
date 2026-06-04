process.env.OPENAI_API_KEY = 'test-openai-key';

const mockCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }));
});

const {
  translateToEnglish,
  containsHebrew,
} = require('../../src/services/translationService');

afterEach(() => {
  mockCreate.mockReset();
});

describe('containsHebrew', () => {
  it('detects pure Hebrew text', () => {
    expect(containsHebrew('אני מרגיש חרדה')).toBe(true);
  });

  it('detects mixed Hebrew + English text', () => {
    expect(containsHebrew("I feel חרדה sometimes")).toBe(true);
  });

  it('returns false for pure English text', () => {
    expect(containsHebrew('I feel anxious today')).toBe(false);
  });

  it('returns false for empty or non-string input', () => {
    expect(containsHebrew('')).toBe(false);
    expect(containsHebrew(null)).toBe(false);
    expect(containsHebrew(undefined)).toBe(false);
    expect(containsHebrew(123)).toBe(false);
  });
});

describe('translateToEnglish', () => {
  it('returns English text unchanged without calling OpenAI', async () => {
    const out = await translateToEnglish('I feel anxious');
    expect(out).toBe('I feel anxious');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns empty/whitespace text unchanged without calling OpenAI', async () => {
    expect(await translateToEnglish('')).toBe('');
    expect(await translateToEnglish('   ')).toBe('   ');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('translates Hebrew text via OpenAI', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'I feel great anxiety and cannot sleep' } }],
    });

    const out = await translateToEnglish('אני מרגיש חרדה גדולה ולא יכול לישון');

    expect(out).toBe('I feel great anxiety and cannot sleep');
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const args = mockCreate.mock.calls[0][0];
    expect(args.model).toBe('gpt-4o-mini');
    expect(args.messages[0].role).toBe('system');
    expect(args.messages[1]).toEqual({
      role: 'user',
      content: 'אני מרגיש חרדה גדולה ולא יכול לישון',
    });
  });

  it('falls back to original text when OpenAI throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('network error'));
    const original = 'אני מרגיש חרדה';

    const out = await translateToEnglish(original);

    expect(out).toBe(original);
  });

  it('falls back to original text when OpenAI returns empty content', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '   ' } }],
    });
    const original = 'אני מרגיש חרדה';

    const out = await translateToEnglish(original);

    expect(out).toBe(original);
  });

  it('trims the translated output', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '   I feel anxious.   ' } }],
    });

    const out = await translateToEnglish('אני מרגיש חרדה');

    expect(out).toBe('I feel anxious.');
  });
});
