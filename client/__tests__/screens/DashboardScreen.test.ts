import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('react-native', () => {
  const ReactLib = require('react');
  return {
    View: 'View',
    Text: 'Text',
    Pressable: 'Pressable',
    StyleSheet: {
      create: (styles: unknown) => styles,
      flatten: (styles: unknown) => styles ?? {},
    },
    Platform: { select: (map: Record<string, unknown>) => map.default ?? map.ios ?? map.android },
  };
});

const mockDispatch = jest.fn();
const mockRefresh = jest.fn();
const mockSetRange = jest.fn();

let mockJournalState = {
  stats: { weeklyStreak: '4', totalEntries: 12, anxietyReduction: '20%' },
  isStatsLoading: false,
  error: null as string | null,
};

let mockTrendState = {
  points: [{ date: '2026-03-20', anxiety: 0.8, mood: 4, entryCount: 1 }],
  summary: { trendDirection: 'increasing' as const, trendPercent: 30 },
  range: 30,
  setRange: mockSetRange,
  refresh: mockRefresh,
};

let mockProgressState = {
  hasData: true,
  anxietyManagedRatio: 0.1,
};

function getDashboardScreen() {
  return require('../../app/screens/DashboardScreen').default;
}

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => cb(),
}));

jest.mock('../../app/store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: { journal: typeof mockJournalState }) => unknown) =>
    selector({ journal: mockJournalState }),
}));

jest.mock('../../app/store/slices/journalSlice', () => ({
  fetchJournalStats: () => ({ type: 'journal/fetchJournalStats' }),
}));

jest.mock('../../app/hooks/useAnxietyTrend', () => ({
  useAnxietyTrend: () => mockTrendState,
}));

jest.mock('../../app/hooks/useUserProgress', () => ({
  useUserProgress: () => mockProgressState,
}));

jest.mock('../../app/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'dashboard.title') return 'Dashboard';
      if (key === 'dashboard.subtitle') return 'Track your anxiety trend';
      if (key === 'dashboard.streak') return 'Streak';
      if (key === 'dashboard.anxietyTrend') return 'Anxiety Trend';
      if (key === 'dashboard.entries') return 'Entries';
      if (key === 'dashboard.yourProgress') return 'Your Progress';
      if (key === 'dashboard.anxietyLevel') return 'Anxiety Level';
      if (key === 'dashboard.managed') return `${params?.percent}% managed`;
      if (key === 'dashboard.insights') return 'Insights';
      if (key === 'dashboard.anxietyReductionInsight') return `Reduced by ${params?.value}`;
      if (key.startsWith('dashboard.chart.')) return `Chart ${params?.percent}%`;
      if (key === 'dashboard.keepJournaling') return 'Keep journaling';
      if (key === 'dashboard.loadingDashboard') return 'Loading dashboard...';
      return key;
    },
  }),
}));

jest.mock('../../app/components/ui', () => ({
  ScreenWrapper: ({ children }: { children: React.ReactNode }) => {
    const ReactLib = require('react');
    return ReactLib.createElement('View', null, children);
  },
  Card: ({ children }: { children: React.ReactNode }) => {
    const ReactLib = require('react');
    return ReactLib.createElement('View', null, children);
  },
  LoadingState: ({ message }: { message: string }) => {
    const ReactLib = require('react');
    return ReactLib.createElement('Text', null, message);
  },
  ErrorState: ({ message }: { message: string }) => {
    const ReactLib = require('react');
    return ReactLib.createElement('Text', null, message);
  },
}));

jest.mock('../../app/components/StatCard', () => ({
  __esModule: true,
  default: ({ label, value, color }: { label: string; value: string | number; color: string }) => {
    const ReactLib = require('react');
    const { View, Text } = require('react-native');
    return ReactLib.createElement(
      View,
      null,
      ReactLib.createElement(Text, null, label),
      ReactLib.createElement(Text, { testID: `${label}-value` }, String(value)),
      ReactLib.createElement(Text, { testID: `${label}-color` }, color),
    );
  },
}));

jest.mock('../../app/components/ProgressBar', () => ({
  __esModule: true,
  default: ({ valueLabel, value }: { valueLabel: string; value: number }) => {
    const ReactLib = require('react');
    const { View, Text } = require('react-native');
    return ReactLib.createElement(
      View,
      null,
      ReactLib.createElement(Text, { testID: 'progress-label' }, valueLabel),
      ReactLib.createElement(Text, { testID: 'progress-value' }, String(value)),
    );
  },
}));

jest.mock('../../app/components/AnxietyChart', () => () => null);

beforeEach(() => {
  mockDispatch.mockClear();
  mockRefresh.mockClear();
  mockSetRange.mockClear();

  mockJournalState = {
    stats: { weeklyStreak: '4', totalEntries: 12, anxietyReduction: '20%' },
    isStatsLoading: false,
    error: null,
  };
  mockTrendState = {
    points: [{ date: '2026-03-20', anxiety: 0.8, mood: 4, entryCount: 1 }],
    summary: { trendDirection: 'increasing', trendPercent: 30 },
    range: 30,
    setRange: mockSetRange,
    refresh: mockRefresh,
  };
  mockProgressState = {
    hasData: true,
    anxietyManagedRatio: 0.1,
  };
});

describe('DashboardScreen UI states', () => {
  it('renders high anxiety state with red trend color', () => {
    // Arrange
    mockTrendState.summary = { trendDirection: 'increasing', trendPercent: 36 };
    mockProgressState = { hasData: true, anxietyManagedRatio: 0.05 };

    // Act
    const DashboardScreen = getDashboardScreen();
    render(React.createElement(DashboardScreen));

    // Assert
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByTestId('Anxiety Trend-value').props.children).toBe('↑36%');
    expect(screen.getByTestId('Anxiety Trend-color').props.children).toBe('#FD746C');
    expect(screen.getByTestId('progress-label').props.children).toBe('5% managed');
  });

  it('renders calm state with green trend color', () => {
    // Arrange
    mockTrendState.summary = { trendDirection: 'improving', trendPercent: 18 };
    mockProgressState = { hasData: true, anxietyManagedRatio: 0.95 };
    mockJournalState.stats = { ...mockJournalState.stats, anxietyReduction: '80%' };

    // Act
    const DashboardScreen = getDashboardScreen();
    render(React.createElement(DashboardScreen));

    // Assert
    expect(screen.getByTestId('Anxiety Trend-value').props.children).toBe('↓18%');
    expect(screen.getByTestId('Anxiety Trend-color').props.children).toBe('#43E97B');
    expect(screen.getByTestId('progress-label').props.children).toBe('95% managed');
    expect(screen.getByText('Reduced by 80%')).toBeTruthy();
  });
});
