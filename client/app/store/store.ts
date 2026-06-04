import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import journalReducer from './slices/journalSlice';
import forumReducer from './slices/forumSlice';
import contentReducer from './slices/contentSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    journal: journalReducer,
    forum: forumReducer,
    content: contentReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
