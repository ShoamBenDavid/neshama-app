import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  dashboardAPI,
  DashboardSummary,
  DashboardTrends,
  DashboardRange,
} from '../../services/api';

interface DashboardState {
  summary: DashboardSummary | null;
  trendsByRange: Partial<Record<DashboardRange, DashboardTrends>>;
  selectedRange: DashboardRange;
  isSummaryLoading: boolean;
  isTrendsLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  summary: null,
  trendsByRange: {},
  selectedRange: 30,
  isSummaryLoading: false,
  isTrendsLoading: false,
  error: null,
};

export const fetchDashboardSummary = createAsyncThunk(
  'dashboard/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getSummary();
      if (response.success) return response.data;
      return rejectWithValue('Failed to load summary');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load summary');
    }
  },
);

export const fetchDashboardTrends = createAsyncThunk(
  'dashboard/fetchTrends',
  async (range: DashboardRange, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getTrends(range);
      if (response.success) return { range, trends: response.data };
      return rejectWithValue('Failed to load trends');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load trends');
    }
  },
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setSelectedRange: (state, action: { payload: DashboardRange }) => {
      state.selectedRange = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDashboardSummary.pending, (state) => {
      state.isSummaryLoading = true;
      state.error = null;
    });
    builder.addCase(fetchDashboardSummary.fulfilled, (state, action) => {
      state.isSummaryLoading = false;
      state.summary = action.payload;
    });
    builder.addCase(fetchDashboardSummary.rejected, (state, action) => {
      state.isSummaryLoading = false;
      state.error = action.payload as string;
    });

    builder.addCase(fetchDashboardTrends.pending, (state) => {
      state.isTrendsLoading = true;
      state.error = null;
    });
    builder.addCase(fetchDashboardTrends.fulfilled, (state, action) => {
      state.isTrendsLoading = false;
      state.trendsByRange[action.payload.range] = action.payload.trends;
    });
    builder.addCase(fetchDashboardTrends.rejected, (state, action) => {
      state.isTrendsLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { setSelectedRange } = dashboardSlice.actions;
export default dashboardSlice.reducer;
