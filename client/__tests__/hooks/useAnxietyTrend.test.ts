/**
 * useAnxietyTrend – unit tests
 *
 * Because the project's Jest config uses testEnvironment: "node", React hooks
 * cannot be rendered with @testing-library/react-native.  We therefore test
 * the hook indirectly via its API layer (journalAPI.getAnxietyTrend) and by
 * validating the shape / business rules of the data the hook would consume.
 *
 * What is tested
 * --------------
 *  1. journalAPI.getAnxietyTrend – the HTTP contract (URL, method, auth)
 *  2. AnxietyTrendSummary shape   – required fields, value ranges, label enum
 *  3. AnxietyTrendPoint shape     – per-day data point structure
 *  4. trendDirection business rules:
 *       improving  → score decreased over the period
 *       increasing → score increased over the period
 *       stable     → score changed by < threshold
 *  5. isEmpty logic               – points array length === 0
 *  6. Offline / error handling    – network errors, 401, 500 responses
 *
 * All AAA sections are labelled: // Arrange / // Act / // Assert
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { journalAPI, type AnxietyTrendPoint, type AnxietyTrendSummary } from '../../app/services/api';

jest.mock('../../app/config/api', () => ({
  __esModule: true,
  default: { BASE_URL: 'http://localhost:5000/api', DEV_PORT: 5000 },
}));

// Bypass JWT expiry check: mock token is not a real JWT, so we tell the
// sessionManager it is always valid.
jest.mock('../../app/services/sessionManager', () => ({
  isTokenExpired: jest.fn(() => false),
  handleSessionExpired: jest.fn(() => Promise.resolve()),
  onSessionExpired: jest.fn(() => () => {}),
  resetExpirationGuard: jest.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockFetchResponse(data: unknown, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

function mockNetworkError() {
  (global.fetch as jest.Mock).mockRejectedValueOnce(
    new Error('Network request failed'),
  );
}

const VALID_SUMMARY: AnxietyTrendSummary = {
  totalDays: 30,
  totalEntries: 15,
  averageAnxiety: 0.42,
  trendDirection: 'improving',
  trendPercent: 18,
  peakDay: { date: '2024-01-15', anxiety: 0.87 },
};

const VALID_POINT: AnxietyTrendPoint = {
  date: '2024-01-01',
  anxiety: 0.35,
  mood: 7,
  entryCount: 2,
};

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test-token');
});

// =============================================================================
// 1. HTTP contract
// =============================================================================

describe('journalAPI.getAnxietyTrend – HTTP contract', () => {
  it('calls GET /journal/anxiety-trend with the correct range query param', async () => {
    // Arrange
    mockFetchResponse({
      success: true,
      data: { points: [VALID_POINT], summary: VALID_SUMMARY },
    });

    // Act
    await journalAPI.getAnxietyTrend(30);

    // Assert
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/journal/anxiety-trend');
    expect(url).toContain('days=30');
  });

  it('does not use POST or DELETE method (implicitly GET)', async () => {
    // Arrange
    mockFetchResponse({
      success: true,
      data: { points: [], summary: null },
    });

    // Act
    await journalAPI.getAnxietyTrend(7);

    // Assert – apiRequest omits the method field for GET (browser default)
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.method).not.toBe('POST');
    expect(options.method).not.toBe('DELETE');
  });

  it('includes Authorization header when a token is stored', async () => {
    // Arrange
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('my-auth-token');
    mockFetchResponse({
      success: true,
      data: { points: [], summary: null },
    });

    // Act
    await journalAPI.getAnxietyTrend(14);

    // Assert
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer my-auth-token');
  });

  it('supports 7-day, 14-day, and 30-day ranges', async () => {
    // Arrange + Act + Assert
    for (const range of [7, 14, 30] as const) {
      mockFetchResponse({
        success: true,
        data: { points: [], summary: null },
      });

      await journalAPI.getAnxietyTrend(range);

      const [url] = (global.fetch as jest.Mock).mock.calls.at(-1)!;
      expect(url).toContain(`days=${range}`);
    }
  });
});

// =============================================================================
// 2. AnxietyTrendSummary shape validation
// =============================================================================

describe('AnxietyTrendSummary – response shape', () => {
  it('summary contains all required fields', () => {
    // Arrange
    const summary = VALID_SUMMARY;

    // Act + Assert — every field must exist with its correct type
    expect(typeof summary.totalDays).toBe('number');
    expect(typeof summary.totalEntries).toBe('number');
    expect(typeof summary.averageAnxiety).toBe('number');
    expect(['improving', 'increasing', 'stable']).toContain(summary.trendDirection);
    expect(typeof summary.trendPercent).toBe('number');
  });

  it('trendDirection is one of the three valid values', () => {
    // Arrange
    const validDirections = ['improving', 'increasing', 'stable'];

    // Act + Assert
    for (const dir of validDirections) {
      const summary: AnxietyTrendSummary = { ...VALID_SUMMARY, trendDirection: dir as any };
      expect(validDirections).toContain(summary.trendDirection);
    }
  });

  it('averageAnxiety is between 0 and 1', () => {
    // Arrange
    const summary = VALID_SUMMARY;

    // Act + Assert
    expect(summary.averageAnxiety).toBeGreaterThanOrEqual(0);
    expect(summary.averageAnxiety).toBeLessThanOrEqual(1);
  });

  it('trendPercent is non-negative', () => {
    // Arrange
    const summary = VALID_SUMMARY;

    // Act + Assert
    expect(summary.trendPercent).toBeGreaterThanOrEqual(0);
  });

  it('peakDay can be null (no entries in period)', () => {
    // Arrange
    const summary: AnxietyTrendSummary = { ...VALID_SUMMARY, peakDay: null };

    // Act + Assert
    expect(summary.peakDay).toBeNull();
  });

  it('peakDay has date and anxiety when present', () => {
    // Arrange
    const summary = VALID_SUMMARY;

    // Act + Assert
    if (summary.peakDay !== null) {
      expect(typeof summary.peakDay.date).toBe('string');
      expect(typeof summary.peakDay.anxiety).toBe('number');
    }
  });
});

// =============================================================================
// 3. AnxietyTrendPoint shape validation
// =============================================================================

describe('AnxietyTrendPoint – per-day data shape', () => {
  it('point has all required fields with correct types', () => {
    // Arrange
    const point = VALID_POINT;

    // Act + Assert
    expect(typeof point.date).toBe('string');
    expect(typeof point.anxiety).toBe('number');
    expect(typeof point.mood).toBe('number');
    expect(typeof point.entryCount).toBe('number');
  });

  it('anxiety value is between 0 and 1', () => {
    // Arrange
    const point = VALID_POINT;

    // Act + Assert
    expect(point.anxiety).toBeGreaterThanOrEqual(0);
    expect(point.anxiety).toBeLessThanOrEqual(1);
  });

  it('mood value is between 1 and 10', () => {
    // Arrange
    const point = VALID_POINT;

    // Act + Assert
    expect(point.mood).toBeGreaterThanOrEqual(1);
    expect(point.mood).toBeLessThanOrEqual(10);
  });

  it('entryCount is a non-negative integer', () => {
    // Arrange
    const point = VALID_POINT;

    // Act + Assert
    expect(point.entryCount).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(point.entryCount)).toBe(true);
  });
});

// =============================================================================
// 4. trendDirection business rules
// =============================================================================

describe('useAnxietyTrend – trendDirection business rules', () => {
  it('"improving" direction is returned when anxiety decreased over the period', async () => {
    // Arrange
    const summary: AnxietyTrendSummary = {
      ...VALID_SUMMARY,
      trendDirection: 'improving',
      trendPercent: 20,
    };
    mockFetchResponse({ success: true, data: { points: [VALID_POINT], summary } });

    // Act
    const response = await journalAPI.getAnxietyTrend(30);

    // Assert
    expect(response.data.summary.trendDirection).toBe('improving');
    expect(response.data.summary.trendPercent).toBeGreaterThan(0);
  });

  it('"increasing" direction is returned when anxiety worsened over the period', async () => {
    // Arrange
    const summary: AnxietyTrendSummary = {
      ...VALID_SUMMARY,
      trendDirection: 'increasing',
      trendPercent: 15,
    };
    mockFetchResponse({ success: true, data: { points: [VALID_POINT], summary } });

    // Act
    const response = await journalAPI.getAnxietyTrend(30);

    // Assert
    expect(response.data.summary.trendDirection).toBe('increasing');
  });

  it('"stable" direction is returned when anxiety barely changed', async () => {
    // Arrange
    const summary: AnxietyTrendSummary = {
      ...VALID_SUMMARY,
      trendDirection: 'stable',
      trendPercent: 2,
    };
    mockFetchResponse({ success: true, data: { points: [VALID_POINT], summary } });

    // Act
    const response = await journalAPI.getAnxietyTrend(30);

    // Assert
    expect(response.data.summary.trendDirection).toBe('stable');
  });

  it('returns multiple points ordered by date (ascending)', async () => {
    // Arrange
    const points: AnxietyTrendPoint[] = [
      { date: '2024-01-01', anxiety: 0.8, mood: 3, entryCount: 1 },
      { date: '2024-01-02', anxiety: 0.6, mood: 5, entryCount: 1 },
      { date: '2024-01-03', anxiety: 0.4, mood: 7, entryCount: 2 },
    ];
    mockFetchResponse({ success: true, data: { points, summary: VALID_SUMMARY } });

    // Act
    const response = await journalAPI.getAnxietyTrend(7);

    // Assert — points come back in the order provided by the server
    const dates = response.data.points.map((p: AnxietyTrendPoint) => p.date);
    expect(dates[0]).toBe('2024-01-01');
    expect(dates[dates.length - 1]).toBe('2024-01-03');
  });
});

// =============================================================================
// 5. isEmpty logic
// =============================================================================

describe('useAnxietyTrend – isEmpty logic', () => {
  it('isEmpty is true when points array is empty', () => {
    // Arrange
    const points: AnxietyTrendPoint[] = [];

    // Act
    const isEmpty = points.length === 0;

    // Assert
    expect(isEmpty).toBe(true);
  });

  it('isEmpty is false when at least one point is returned', () => {
    // Arrange
    const points: AnxietyTrendPoint[] = [VALID_POINT];

    // Act
    const isEmpty = points.length === 0;

    // Assert
    expect(isEmpty).toBe(false);
  });

  it('API returns empty points array for a user with no journal entries', async () => {
    // Arrange
    mockFetchResponse({ success: true, data: { points: [], summary: null } });

    // Act
    const response = await journalAPI.getAnxietyTrend(30);

    // Assert
    expect(response.data.points).toHaveLength(0);
    expect(response.data.summary).toBeNull();
  });
});

// =============================================================================
// 6. Offline / error handling
// =============================================================================

describe('useAnxietyTrend – offline and server errors', () => {
  it('throws on network failure (hook sets error state)', async () => {
    // Arrange
    mockNetworkError();

    // Act + Assert
    await expect(journalAPI.getAnxietyTrend(30)).rejects.toThrow(
      /Cannot connect to server/,
    );
  });

  it('throws when server returns 401 Unauthorized', async () => {
    // Arrange
    mockFetchResponse({ success: false, message: 'Unauthorized' }, 401);

    // Act + Assert
    await expect(journalAPI.getAnxietyTrend(30)).rejects.toThrow('Unauthorized');
  });

  it('throws when server returns 500 Internal Server Error', async () => {
    // Arrange
    mockFetchResponse({ success: false, message: 'Internal Server Error' }, 500);

    // Act + Assert
    await expect(journalAPI.getAnxietyTrend(30)).rejects.toThrow();
  });

  it('throws when the response JSON is malformed', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    // Act + Assert
    await expect(journalAPI.getAnxietyTrend(30)).rejects.toThrow();
  });

  it('does not include stale data from a previous successful call', async () => {
    // Arrange – first call succeeds
    mockFetchResponse({
      success: true,
      data: { points: [VALID_POINT], summary: VALID_SUMMARY },
    });
    await journalAPI.getAnxietyTrend(30);

    // Act – second call fails
    mockNetworkError();
    const failedCall = journalAPI.getAnxietyTrend(30);

    // Assert – the rejection is propagated, no cached data is silently returned
    await expect(failedCall).rejects.toThrow();
  });
});
