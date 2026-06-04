import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { contentAPI, ContentItem } from '../../services/api';

interface ContentState {
  items: ContentItem[];
  recommended: ContentItem[];
  favorites: string[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ContentState = {
  items: [],
  recommended: [],
  favorites: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchContent = createAsyncThunk(
  'content/fetchContent',
  async (params: { category?: string; type?: string; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await contentAPI.getContent(params);
      if (response.success) {
        return response.data.content;
      }
      return rejectWithValue('Failed to fetch content');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch content');
    }
  }
);

export const fetchRecommendedContent = createAsyncThunk(
  'content/fetchRecommended',
  async (_, { rejectWithValue }) => {
    try {
      const response = await contentAPI.getRecommended();
      if (response.success) {
        return response.data.content;
      }
      return rejectWithValue('Failed to fetch recommended content');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch recommended content');
    }
  }
);

export const seedContentData = createAsyncThunk(
  'content/seed',
  async (_, { rejectWithValue }) => {
    try {
      const response = await contentAPI.seedContent();
      if (response.success) {
        return response.message;
      }
      return rejectWithValue('Failed to seed content');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to seed content');
    }
  }
);

const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    toggleFavorite: (state, action) => {
      const id = action.payload;
      if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter(fav => fav !== id);
      } else {
        state.favorites.push(id);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch content
    builder.addCase(fetchContent.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchContent.fulfilled, (state, action) => {
      state.isLoading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchContent.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Fetch recommended
    builder.addCase(fetchRecommendedContent.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchRecommendedContent.fulfilled, (state, action) => {
      state.isLoading = false;
      state.recommended = action.payload;
    });
    builder.addCase(fetchRecommendedContent.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, toggleFavorite } = contentSlice.actions;
export default contentSlice.reducer;

