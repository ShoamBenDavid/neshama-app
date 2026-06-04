import { configureStore } from '@reduxjs/toolkit';
import chatReducer, {
  sendChatMessage,
  clearChat,
  clearError,
} from '../../app/store/slices/chatSlice';

jest.mock('../../app/config/api', () => ({
  __esModule: true,
  default: { BASE_URL: 'http://localhost:5000/api', DEV_PORT: 5000 },
}));

function createTestStore() {
  return configureStore({
    reducer: { chat: chatReducer },
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

describe('chatSlice', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().chat;

      expect(state.messages).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('reducers', () => {
    it('clearChat should clear all messages', () => {
      const store = createTestStore();
      store.dispatch(clearChat());
      expect(store.getState().chat.messages).toEqual([]);
      expect(store.getState().chat.error).toBeNull();
    });

    it('clearError should clear the error', () => {
      const store = createTestStore();
      store.dispatch(clearError());
      expect(store.getState().chat.error).toBeNull();
    });
  });

  describe('sendChatMessage', () => {
    it('should add user message on pending and AI response on fulfilled', async () => {
      const store = createTestStore();
      mockFetchResponse({
        success: true,
        data: { message: 'שלום! איך אני יכול לעזור?' },
      });

      await store.dispatch(
        sendChatMessage({
          message: 'שלום',
          history: [],
        })
      );

      const state = store.getState().chat;
      expect(state.messages).toHaveLength(2);
      expect(state.messages[0].role).toBe('user');
      expect(state.messages[0].content).toBe('שלום');
      expect(state.messages[1].role).toBe('assistant');
      expect(state.messages[1].content).toBe('שלום! איך אני יכול לעזור?');
      expect(state.isLoading).toBe(false);
    });

    it('should add error message on rejection', async () => {
      const store = createTestStore();
      mockFetchResponse(
        { success: false, message: 'Failed to get AI response' },
        500
      );

      await store.dispatch(
        sendChatMessage({
          message: 'שלום',
          history: [],
        })
      );

      const state = store.getState().chat;
      expect(state.messages).toHaveLength(2);
      expect(state.messages[0].role).toBe('user');
      expect(state.messages[1].role).toBe('assistant');
      expect(state.messages[1].content).toContain('שגיאה');
      expect(state.isLoading).toBe(false);
    });

    it('should accumulate messages across multiple calls', async () => {
      const store = createTestStore();

      mockFetchResponse({
        success: true,
        data: { message: 'תשובה 1' },
      });
      await store.dispatch(
        sendChatMessage({ message: 'הודעה 1', history: [] })
      );

      mockFetchResponse({
        success: true,
        data: { message: 'תשובה 2' },
      });
      await store.dispatch(
        sendChatMessage({ message: 'הודעה 2', history: [] })
      );

      const state = store.getState().chat;
      expect(state.messages).toHaveLength(4);
    });

    it('clearChat should remove all accumulated messages', async () => {
      const store = createTestStore();

      mockFetchResponse({
        success: true,
        data: { message: 'Response' },
      });
      await store.dispatch(
        sendChatMessage({ message: 'Hello', history: [] })
      );
      expect(store.getState().chat.messages).toHaveLength(2);

      store.dispatch(clearChat());
      expect(store.getState().chat.messages).toHaveLength(0);
    });

    it('should use fallback message when payload is null', async () => {
      const store = createTestStore();
      mockFetchResponse({
        success: true,
        data: { message: null },
      });

      await store.dispatch(
        sendChatMessage({ message: 'שלום', history: [] })
      );

      const state = store.getState().chat;
      expect(state.messages).toHaveLength(2);
      // null message means success=true but data.message is falsy,
      // so the thunk hits rejectWithValue -> rejected handler adds error message
      expect(state.messages[1].role).toBe('assistant');
      expect(state.messages[1].content).toContain('שגיאה');
    });

    it('should handle network error', async () => {
      const store = createTestStore();
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network request failed')
      );

      await store.dispatch(
        sendChatMessage({ message: 'שלום', history: [] })
      );

      const state = store.getState().chat;
      expect(state.messages).toHaveLength(2);
      expect(state.messages[1].role).toBe('assistant');
      expect(state.messages[1].content).toContain('שגיאה');
      expect(state.error).toBeDefined();
    });

    it('should set isLoading to false after completion', async () => {
      const store = createTestStore();
      mockFetchResponse({ success: true, data: { message: 'OK' } });

      await store.dispatch(
        sendChatMessage({ message: 'test', history: [] })
      );

      expect(store.getState().chat.isLoading).toBe(false);
    });
  });
});
