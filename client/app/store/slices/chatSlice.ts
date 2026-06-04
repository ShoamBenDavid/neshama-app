import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { chatAPI, ChatMessage } from '../../services/api';

interface ChatState {
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { message, history }: { message: string; history: ChatMessage[] },
    { rejectWithValue }
  ) => {
    try {
      const response = await chatAPI.sendMessage(message, history);
      if (response.success && response.data?.message) {
        return response.data.message;
      }
      return rejectWithValue(
        (response as any)?.message || 'Failed to get AI response'
      );
    } catch (error: any) {
      console.error('Chat API error:', error);
      return rejectWithValue(error.message || 'Failed to get AI response');
    }
  }
);

let messageIdCounter = 0;

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearChat: (state) => {
      state.messages = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sendChatMessage.pending, (state, action) => {
      state.isLoading = true;
      state.error = null;
      state.messages.push({
        id: `user-${++messageIdCounter}`,
        role: 'user',
        content: action.meta.arg.message,
      });
    });
    builder.addCase(sendChatMessage.fulfilled, (state, action) => {
      state.isLoading = false;
      state.messages.push({
        id: `ai-${++messageIdCounter}`,
        role: 'assistant',
        content: action.payload || 'מצטער, לא הצלחתי לעבד את ההודעה.',
      });
    });
    builder.addCase(sendChatMessage.rejected, (state, action) => {
      state.isLoading = false;
      const errorMsg = action.payload as string;
      state.error = errorMsg;
      state.messages.push({
        id: `ai-error-${++messageIdCounter}`,
        role: 'assistant',
        content: `שגיאה: ${errorMsg || 'אירעה שגיאה לא ידועה. אנא נסה שוב.'}`,
      });
    });
  },
});

export const { clearChat, clearError } = chatSlice.actions;
export default chatSlice.reducer;
