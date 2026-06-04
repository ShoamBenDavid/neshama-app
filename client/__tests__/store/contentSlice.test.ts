import { configureStore } from '@reduxjs/toolkit';
import contentReducer, {
  fetchContent,
  fetchRecommendedContent,
  seedContentData,
  clearError,
  toggleFavorite,
} from '../../app/store/slices/contentSlice';

jest.mock('../../app/config/api', () => ({
  __esModule: true,
  default: { BASE_URL: 'http://localhost:5000/api', DEV_PORT: 5000 },
}));

function createTestStore() {
  return configureStore({
    reducer: { content: contentReducer },
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

const sampleContent = {
  id: 'content-1',
  title: 'מדיטציית הכרת תודה',
  description: 'מדיטציה להתמקדות בדברים הטובים.',
  duration: '10 דקות',
  category: 'מיינדפולנס',
  type: 'meditation' as const,
  gradientColors: ['#10B981', '#34D399'],
  tags: ['מיינדפולנס'],
};

describe('contentSlice', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().content;

      expect(state.items).toEqual([]);
      expect(state.recommended).toEqual([]);
      expect(state.favorites).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('reducers', () => {
    it('clearError should clear error', () => {
      const store = createTestStore();
      store.dispatch(clearError());
      expect(store.getState().content.error).toBeNull();
    });

    it('toggleFavorite should add to favorites', () => {
      const store = createTestStore();
      store.dispatch(toggleFavorite('content-1'));
      expect(store.getState().content.favorites).toContain('content-1');
    });

    it('toggleFavorite should remove from favorites', () => {
      const store = createTestStore();
      store.dispatch(toggleFavorite('content-1'));
      expect(store.getState().content.favorites).toContain('content-1');

      store.dispatch(toggleFavorite('content-1'));
      expect(store.getState().content.favorites).not.toContain('content-1');
    });
  });

  describe('fetchContent', () => {
    it('should set items on success', async () => {
      const store = createTestStore();
      mockFetchResponse({
        success: true,
        data: { content: [sampleContent] },
      });

      await store.dispatch(fetchContent({}));

      const state = store.getState().content;
      expect(state.items).toHaveLength(1);
      expect(state.items[0].title).toBe('מדיטציית הכרת תודה');
      expect(state.isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false }, 500);

      await store.dispatch(fetchContent({}));

      expect(store.getState().content.error).toBeDefined();
    });
  });

  describe('fetchRecommendedContent', () => {
    it('should set recommended on success', async () => {
      const store = createTestStore();
      mockFetchResponse({
        success: true,
        data: { content: [sampleContent] },
      });

      await store.dispatch(fetchRecommendedContent());

      const state = store.getState().content;
      expect(state.recommended).toHaveLength(1);
      expect(state.isLoading).toBe(false);
    });

    it('should set error on failure', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false }, 500);

      await store.dispatch(fetchRecommendedContent());

      expect(store.getState().content.error).toBeDefined();
    });
  });

  describe('seedContentData', () => {
    it('should dispatch without error on success', async () => {
      const store = createTestStore();
      mockFetchResponse({
        success: true,
        message: '10 content items seeded successfully',
      });

      const result = await store.dispatch(seedContentData());
      expect(result.type).toContain('fulfilled');
    });

    it('should set error on seed failure', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: false, message: 'Already seeded' }, 400);

      const result = await store.dispatch(seedContentData());
      expect(result.type).toContain('rejected');
    });
  });

  describe('pending states', () => {
    it('fetchContent should set isLoading to false after completion', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: true, data: { content: [sampleContent] } });

      await store.dispatch(fetchContent({}));
      expect(store.getState().content.isLoading).toBe(false);
    });

    it('fetchRecommendedContent should set isLoading to false after completion', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: true, data: { content: [sampleContent] } });

      await store.dispatch(fetchRecommendedContent());
      expect(store.getState().content.isLoading).toBe(false);
    });
  });
});
