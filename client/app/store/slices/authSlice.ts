import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  authAPI,
  ApiError,
  User,
  RegisterData,
  LoginData,
  getStoredUser,
  getStoredToken,
  clearAuthData,
} from '../../services/api';
import { isTokenExpired, resetExpirationGuard } from '../../services/sessionManager';
// Types
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCheckingAuth: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,
  error: null,
};

// Async thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Registration failed');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  },
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginData, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Login failed');
    } catch (error: any) {
      if (error instanceof ApiError) {
        if (error.code) {
          return rejectWithValue(error.code);
        }
        if (error.status === 401) {
          return rejectWithValue('INVALID_CREDENTIALS');
        }
      }
      return rejectWithValue(error.message || 'Login failed');
    }
  },
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  },
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getStoredToken();
      const user = await getStoredUser();

      if (!token || !user) {
        return { isAuthenticated: false, user: null, token: null };
      }

      if (isTokenExpired(token)) {
        await clearAuthData();
        return { isAuthenticated: false, user: null, token: null };
      }

      try {
        const response = await authAPI.getMe();
        if (response.success && response.data) {
          return { isAuthenticated: true, user: response.data.user, token };
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clearAuthData();
          return { isAuthenticated: false, user: null, token: null };
        }
        // Network error — allow offline access with a non-expired token
        return { isAuthenticated: true, user, token };
      }

      return { isAuthenticated: false, user: null, token: null };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Auth check failed');
    }
  },
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    sessionExpired: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = 'קיים כבר משתמש עם אימייל כמו שהכנסת';
    });

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logoutUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      resetExpirationGuard();
    });
    builder.addCase(logoutUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Check Auth Status
    builder.addCase(checkAuthStatus.pending, (state) => {
      state.isCheckingAuth = true;
    });
    builder.addCase(checkAuthStatus.fulfilled, (state, action) => {
      state.isCheckingAuth = false;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.user = action.payload.user;
      state.token = action.payload.token;
    });
    builder.addCase(checkAuthStatus.rejected, (state) => {
      state.isCheckingAuth = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    });
  },
});

export const { clearError, setUser, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
