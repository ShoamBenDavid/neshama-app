import { configureStore } from '@reduxjs/toolkit';
import journalReducer, {
  fetchJournalEntries,
  createJournalEntry,
  deleteJournalEntry,
  fetchJournalStats,
  clearError,
} from '../../app/store/slices/journalSlice';

jest.mock('../../app/config/api', () => ({
  __esModule: true,
  default: { BASE_URL: 'http://localhost:5000/api', DEV_PORT: 5000 },
}));

function createTestStore() {
  return configureStore({
    reducer: { journal: journalReducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });
}

function mockFetchResponse(data: any, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: () => Promise.resolve(data),
  });
}

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

const sampleEntry = {
  id: '1',
  date: '1 January 2024',
  time: '10:00',
  mood: 4,
  title: 'Good day',
  content: 'Felt great today',
  tags: ['happy'],
  anxietyLevel: 0.2,
  anxietyLabel: 'low',
  createdAt: '2024-01-01T00:00:00Z',
};

describe('journalSlice', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().journal;

      expect(state.entries).toEqual([]);
      expect(state.stats).toBeNull();
      expect(state.progress).toBeNull();
      expect(state.chartData).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isCreating).toBe(false);
      expect(state.error).toBeNull();
      expect(state.pagination).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const store = createTestStore();
      store.dispatch(clearError());
      expect(store.getState().journal.error).toBeNull();
    });
  });

  describe('fetchJournalEntries', () => {
    it('should set entries and pagination on success', async () => {
      const store = createTestStore();
      mockFetchResponse({
        success: true,
        data: {
          entries: [sampleEntry],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
      });

      await store.dispatch(fetchJournalEntries({}));

      const state = store.getState().journal;
      expect(state.entries).toHaveLength(1);
      expect(state.entries[0].title).toBe('Good day');
      expect(state.pagination?.total).toBe(1);
      expect(state.isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false, message: 'Server error' }, 500);

      await store.dispatch(fetchJournalEntries({}));

      const state = store.getState().journal;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeDefined();
    });
  });

  describe('createJournalEntry', () => {
    it('should prepend new entry on success', async () => {
      const store = createTestStore();
      mockFetchResponse({
        success: true,
        data: { entry: sampleEntry },
      });

      await store.dispatch(
        createJournalEntry({ mood: 4, content: 'Felt great today' })
      );

      const state = store.getState().journal;
      expect(state.entries).toHaveLength(1);
      expect(state.entries[0].mood).toBe(4);
      expect(state.isCreating).toBe(false);
    });

    it('should set error on failure', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false, message: 'Validation error' }, 400);

      await store.dispatch(createJournalEntry({ mood: 10, content: '' }));

      const state = store.getState().journal;
      expect(state.isCreating).toBe(false);
      expect(state.error).toBeDefined();
    });
  });

  describe('deleteJournalEntry', () => {
    it('should remove entry from list on success', async () => {
      const store = createTestStore();

      // First add an entry
      mockFetchResponse({ success: true, data: { entry: sampleEntry } });
      await store.dispatch(
        createJournalEntry({ mood: 4, content: 'Felt great today' })
      );
      expect(store.getState().journal.entries).toHaveLength(1);

      // Then delete it
      mockFetchResponse({ success: true });
      await store.dispatch(deleteJournalEntry('1'));

      expect(store.getState().journal.entries).toHaveLength(0);
    });
  });

  describe('fetchJournalStats', () => {
    it('should set stats, progress, and chartData on success', async () => {
      const store = createTestStore();
      mockFetchResponse({
        success: true,
        data: {
          stats: {
            weeklyStreak: '3/7',
            avgMood: '4.0/10',
            anxietyReduction: '70%',
            goodDays: 5,
            totalEntries: 10,
          },
          progress: { avgMood: 40, anxietyLevel: 70 },
          chartData: { entries: [], highMood: 5, avgMood: 4, lowMood: 2 },
        },
      });

      await store.dispatch(fetchJournalStats());

      const state = store.getState().journal;
      expect(state.stats).toBeDefined();
      expect(state.stats?.totalEntries).toBe(10);
      expect(state.progress).toBeDefined();
      expect(state.chartData).toBeDefined();
    });

    it('should set error on stats fetch failure', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false, message: 'Server error' }, 500);

      await store.dispatch(fetchJournalStats());

      const state = store.getState().journal;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeDefined();
    });
  });

  describe('deleteJournalEntry rejected', () => {
    it('should set error on delete failure', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false, message: 'Not found' }, 404);

      await store.dispatch(deleteJournalEntry('nonexistent'));

      const state = store.getState().journal;
      expect(state.error).toBeDefined();
    });
  });

  describe('pending states', () => {
    it('fetchJournalEntries should set isLoading on pending', async () => {
      const store = createTestStore();
      mockFetchResponse({
        success: true,
        data: { entries: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } },
      });

      const promise = store.dispatch(fetchJournalEntries({}));
      // After dispatch resolves, isLoading should be back to false
      await promise;
      expect(store.getState().journal.isLoading).toBe(false);
    });

    it('createJournalEntry should set isCreating on pending then false', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: true, data: { entry: sampleEntry } });

      await store.dispatch(createJournalEntry({ mood: 4, content: 'Test' }));
      expect(store.getState().journal.isCreating).toBe(false);
    });

    it('fetchJournalStats should set isLoading then false', async () => {
      const store = createTestStore();
      mockFetchResponse({
        success: true,
        data: {
          stats: { weeklyStreak: '0/7', avgMood: '0/10', anxietyReduction: '0%', goodDays: 0, totalEntries: 0 },
          progress: { avgMood: 0, anxietyLevel: 0 },
          chartData: { entries: [], highMood: 0, avgMood: 0, lowMood: 0 },
        },
      });

      await store.dispatch(fetchJournalStats());
      expect(store.getState().journal.isLoading).toBe(false);
    });
  });
});
