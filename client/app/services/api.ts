import AsyncStorage from '@react-native-async-storage/async-storage';
import API_CONFIG from '../config/api';
import { isTokenExpired, handleSessionExpired } from './sessionManager';

const getBaseUrl = (): string => API_CONFIG.BASE_URL;

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  achievements?: UserAchievement[];
  createdAt: string;
}

export interface UserAchievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  unlockedAt?: string | null;
  progress?: number;
  target?: number;
  isUnlocked: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
  errors?: Array<{ msg: string; path: string }>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Journal Types
export interface JournalEntry {
  id: string;
  date: string;
  time: string;
  mood: number;
  title?: string;
  content: string;
  tags: string[];
  anxietyLevel?: number;
  anxietyLabel?: string;
  createdAt: string;
}

export interface CreateJournalEntry {
  mood: number;
  title?: string;
  content: string;
  tags?: string[];
}

export interface JournalStats {
  weeklyStreak: string;
  avgMood: string;
  anxietyReduction: string;
  goodDays: number;
  totalEntries: number;
}

// Anxiety Trend Types
export interface AnxietyTrendPoint {
  date: string;
  anxiety: number;
  mood: number;
  entryCount: number;
}

export interface AnxietyTrendSummary {
  totalDays: number;
  totalEntries: number;
  averageAnxiety: number;
  trendDirection: 'improving' | 'increasing' | 'stable';
  trendPercent: number;
  peakDay: { date: string; anxiety: number } | null;
}

// Forum Types
export interface ForumPost {
  id: string;
  author: string;
  isAnonymous: boolean;
  date: string;
  title: string;
  content: string;
  categoryId: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export interface CreateForumPost {
  title: string;
  content: string;
  categoryId: string;
  isAnonymous?: boolean;
}

// Content Types
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  type: 'meditation' | 'breathing' | 'yoga' | 'article' | 'video' | 'audio';
  gradientColors: string[];
  imageUrl?: string;
  tags: string[];
}
// Helper function to get stored token
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// Helper function to store token
export const storeToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

// Helper function to store user data
export const storeUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user:', error);
  }
};

// Helper function to get stored user
export const getStoredUser = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Helper function to clear auth data
export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = await getStoredToken();

  if (token && !AUTH_ENDPOINTS.includes(endpoint) && isTokenExpired(token)) {
    await handleSessionExpired();
    throw new ApiError('Token has expired', 401, 'TOKEN_EXPIRED');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const url = `${getBaseUrl()}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorCode: string | undefined;
      try {
        const errorData = await response.json();
        errorCode = errorData.code;

        if (
          errorData.errors &&
          Array.isArray(errorData.errors) &&
          errorData.errors.length > 0
        ) {
          const validationErrors = errorData.errors
            .map(
              (err: any) => err.msg || err.message || `${err.path}: ${err.msg}`,
            )
            .join(', ');
          errorMessage = validationErrors;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Response is not JSON - use status text
      }

      if (
        response.status === 401 &&
        !AUTH_ENDPOINTS.includes(endpoint)
      ) {
        await handleSessionExpired();
        throw new ApiError(errorMessage, 401, errorCode || 'TOKEN_EXPIRED');
      }

      throw new ApiError(errorMessage, response.status, errorCode);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;

    if (
      error.message === 'Network request failed' ||
      error.message === 'Failed to fetch'
    ) {
      const baseUrl = getBaseUrl();
      throw new ApiError(
        `Cannot connect to server. Please ensure the server is running at ${baseUrl}`,
        0,
        'NETWORK_ERROR',
      );
    }
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  // Register a new user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      await storeToken(response.data.token);
      await storeUser(response.data.user);
    }

    return response;
  },

  // Login user
  login: async (credentials: LoginData): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      await storeToken(response.data.token);
      await storeUser(response.data.user);
    }

    return response;
  },

  // Get current user
  getMe: async (): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/me');
  },

  // Update profile
  updateProfile: async (data: Partial<User>): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getAchievements: async (): Promise<{
    success: boolean;
    data: { achievements: UserAchievement[] };
  }> => {
    return apiRequest<{
      success: boolean;
      data: { achievements: UserAchievement[] };
    }>('/auth/achievements');
  },

  updateAchievement: async (
    id: string,
    data: Pick<Partial<UserAchievement>, 'progress' | 'isUnlocked'>,
  ): Promise<{
    success: boolean;
    data: { achievement: UserAchievement; achievements: UserAchievement[] };
  }> => {
    return apiRequest<{
      success: boolean;
      data: { achievement: UserAchievement; achievements: UserAchievement[] };
    }>(`/auth/achievements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Logout
  logout: async (): Promise<void> => {
    await clearAuthData();
  },

  // Check if user is logged in
  checkAuthStatus: async (): Promise<{
    isAuthenticated: boolean;
    user: User | null;
  }> => {
    const token = await getStoredToken();
    const user = await getStoredUser();

    if (!token || !user) {
      return { isAuthenticated: false, user: null };
    }

    try {
      // Verify token is still valid by calling getMe
      const response = await authAPI.getMe();
      if (response.success && response.data) {
        return { isAuthenticated: true, user: response.data.user };
      }
    } catch (error) {
      // Token is invalid, clear storage
      await clearAuthData();
    }

    return { isAuthenticated: false, user: null };
  },
};

// Journal API functions
export const journalAPI = {
  // Get all journal entries
  getEntries: async (params?: {
    page?: number;
    limit?: number;
    mood?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.mood) queryParams.append('mood', String(params.mood));

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest<{
      success: boolean;
      data: { entries: JournalEntry[]; pagination: any };
    }>(`/journal${query}`);
  },

  // Create new journal entry
  createEntry: async (entry: CreateJournalEntry) => {
    return apiRequest<{ success: boolean; data: { entry: JournalEntry } }>(
      '/journal',
      {
        method: 'POST',
        body: JSON.stringify(entry),
      },
    );
  },

  // Get single entry
  getEntry: async (id: string) => {
    return apiRequest<{ success: boolean; data: { entry: JournalEntry } }>(
      `/journal/${id}`,
    );
  },

  // Update entry
  updateEntry: async (id: string, entry: Partial<CreateJournalEntry>) => {
    return apiRequest<{ success: boolean; data: { entry: JournalEntry } }>(
      `/journal/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(entry),
      },
    );
  },

  // Delete entry
  deleteEntry: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/journal/${id}`, {
      method: 'DELETE',
    });
  },

  // Get journal statistics
  getStats: async () => {
    return apiRequest<{
      success: boolean;
      data: {
        stats: JournalStats;
        progress: { avgMood: number; anxietyLevel: number };
        chartData: {
          entries: any[];
          highMood: number;
          avgMood: number;
          lowMood: number;
        };
      };
    }>('/journal/stats');
  },

  // Get anxiety trend data for chart
  getAnxietyTrend: async (days: number = 30) => {
    return apiRequest<{
      success: boolean;
      data: {
        points: AnxietyTrendPoint[];
        summary: AnxietyTrendSummary;
      };
    }>(`/journal/anxiety-trend?days=${days}`);
  },
};

// Forum API functions
export const forumAPI = {
  // Get all posts
  getPosts: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.category) queryParams.append('category', params.category);
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest<{
      success: boolean;
      data: { posts: ForumPost[]; pagination: any };
    }>(`/forum${query}`);
  },

  // Create new post
  createPost: async (post: CreateForumPost) => {
    return apiRequest<{ success: boolean; data: { post: ForumPost } }>(
      '/forum',
      {
        method: 'POST',
        body: JSON.stringify(post),
      },
    );
  },

  // Get single post with comments
  getPost: async (id: string) => {
    return apiRequest<{
      success: boolean;
      data: { post: ForumPost & { comments: any[] } };
    }>(`/forum/${id}`);
  },

  // Toggle like
  toggleLike: async (id: string) => {
    return apiRequest<{
      success: boolean;
      data: { likes: number; isLiked: boolean };
    }>(`/forum/${id}/like`, {
      method: 'POST',
    });
  },

  // Add comment
  addComment: async (id: string, content: string, isAnonymous?: boolean) => {
    return apiRequest<{
      success: boolean;
      data: { comment: any; commentsCount: number };
    }>(`/forum/${id}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content, isAnonymous }),
    });
  },

  // Delete post
  deletePost: async (id: string) => {
    return apiRequest<{ success: boolean }>(`/forum/${id}`, {
      method: 'DELETE',
    });
  },
};

// Content API functions
export const contentAPI = {
  // Get all content
  getContent: async (params?: {
    category?: string;
    type?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest<{ success: boolean; data: { content: ContentItem[] } }>(
      `/content${query}`,
    );
  },

  // Get recommended content
  getRecommended: async () => {
    return apiRequest<{ success: boolean; data: { content: ContentItem[] } }>(
      '/content/recommended',
    );
  },

  // Get single content item
  getContentById: async (id: string) => {
    return apiRequest<{ success: boolean; data: { content: ContentItem } }>(
      `/content/${id}`,
    );
  },

  // Seed content (one-time setup)
  seedContent: async () => {
    return apiRequest<{ success: boolean; message: string }>('/content/seed', {
      method: 'POST',
    });
  },
};

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Chat API functions
export const chatAPI = {
  sendMessage: async (message: string, history: ChatMessage[]) => {
    return apiRequest<{ success: boolean; data: { message: string } }>(
      '/chat/message',
      {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      },
    );
  },
};

export default authAPI;
