import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  journalAPI,
  type AnxietyTrendPoint,
  type AnxietyTrendSummary,
} from '../services/api';

export type TimeRange = 7 | 14 | 30;

export interface AnxietyTrendData {
  points: AnxietyTrendPoint[];
  summary: AnxietyTrendSummary | null;
  isLoading: boolean;
  error: string | null;
  range: TimeRange;
  setRange: (range: TimeRange) => void;
  refresh: () => void;
  isEmpty: boolean;
}

export function useAnxietyTrend(initialRange: TimeRange = 30): AnxietyTrendData {
  const [points, setPoints] = useState<AnxietyTrendPoint[]>([]);
  const [summary, setSummary] = useState<AnxietyTrendSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<TimeRange>(initialRange);
  const rangeRef = useRef(range);
  rangeRef.current = range;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await journalAPI.getAnxietyTrend(rangeRef.current);
      if (response.success) {
        setPoints(response.data.points);
        setSummary(response.data.summary);
      } else {
        setError('Failed to load trend data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load trend data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [range, fetchData]);

  const isEmpty = useMemo(() => points.length === 0, [points]);

  return {
    points,
    summary,
    isLoading,
    error,
    range,
    setRange,
    refresh: fetchData,
    isEmpty,
  };
}
