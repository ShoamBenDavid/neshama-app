import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { forumAPI, ForumPost, CreateForumPost } from '../../services/api';

interface ForumState {
  posts: ForumPost[];
  selectedPost: (ForumPost & { comments: any[] }) | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
}

const initialState: ForumState = {
  posts: [],
  selectedPost: null,
  isLoading: false,
  isCreating: false,
  error: null,
  pagination: null,
};

// Async thunks
export const fetchForumPosts = createAsyncThunk(
  'forum/fetchPosts',
  async (params: { page?: number; limit?: number; category?: string; sort?: string; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await forumAPI.getPosts(params);
      if (response.success) {
        return response.data;
      }
      return rejectWithValue('Failed to fetch posts');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch posts');
    }
  }
);

export const createForumPost = createAsyncThunk(
  'forum/createPost',
  async (post: CreateForumPost, { rejectWithValue }) => {
    try {
      const response = await forumAPI.createPost(post);
      if (response.success) {
        return response.data.post;
      }
      return rejectWithValue('Failed to create post');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create post');
    }
  }
);

export const fetchForumPost = createAsyncThunk(
  'forum/fetchPost',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await forumAPI.getPost(id);
      if (response.success) {
        return response.data.post;
      }
      return rejectWithValue('Failed to fetch post');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch post');
    }
  }
);

export const togglePostLike = createAsyncThunk(
  'forum/toggleLike',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await forumAPI.toggleLike(id);
      if (response.success) {
        return { id, ...response.data };
      }
      return rejectWithValue('Failed to toggle like');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to toggle like');
    }
  }
);

export const addPostComment = createAsyncThunk(
  'forum/addComment',
  async ({ id, content, isAnonymous }: { id: string; content: string; isAnonymous?: boolean }, { rejectWithValue }) => {
    try {
      const response = await forumAPI.addComment(id, content, isAnonymous);
      if (response.success) {
        return { id, ...response.data };
      }
      return rejectWithValue('Failed to add comment');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add comment');
    }
  }
);

export const deleteForumPost = createAsyncThunk(
  'forum/deletePost',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await forumAPI.deletePost(id);
      if (response.success) {
        return id;
      }
      return rejectWithValue('Failed to delete post');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete post');
    }
  }
);

const forumSlice = createSlice({
  name: 'forum',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedPost: (state) => {
      state.selectedPost = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch posts
    builder.addCase(fetchForumPosts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchForumPosts.fulfilled, (state, action) => {
      state.isLoading = false;
      state.posts = action.payload.posts;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchForumPosts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Create post
    builder.addCase(createForumPost.pending, (state) => {
      state.isCreating = true;
      state.error = null;
    });
    builder.addCase(createForumPost.fulfilled, (state, action) => {
      state.isCreating = false;
      state.posts.unshift(action.payload);
    });
    builder.addCase(createForumPost.rejected, (state, action) => {
      state.isCreating = false;
      state.error = action.payload as string;
    });

    // Fetch single post
    builder.addCase(fetchForumPost.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchForumPost.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedPost = action.payload;
    });
    builder.addCase(fetchForumPost.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Toggle like
    builder.addCase(togglePostLike.fulfilled, (state, action) => {
      const post = state.posts.find(p => p.id === action.payload.id);
      if (post) {
        post.likes = action.payload.likes;
        post.isLiked = action.payload.isLiked;
      }
      if (state.selectedPost?.id === action.payload.id) {
        state.selectedPost.likes = action.payload.likes;
        state.selectedPost.isLiked = action.payload.isLiked;
      }
    });

    // Add comment
    builder.addCase(addPostComment.fulfilled, (state, action) => {
      const post = state.posts.find(p => p.id === action.payload.id);
      if (post) {
        post.comments = action.payload.commentsCount;
      }
      if (state.selectedPost?.id === action.payload.id) {
        state.selectedPost.comments.push(action.payload.comment);
      }
    });

    // Delete post
    builder.addCase(deleteForumPost.fulfilled, (state, action) => {
      state.posts = state.posts.filter(post => post.id !== action.payload);
    });
  },
});

export const { clearError, clearSelectedPost } = forumSlice.actions;
export default forumSlice.reducer;

