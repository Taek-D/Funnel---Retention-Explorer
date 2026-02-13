import { useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import type { DateRange } from '../types';

export function useFilteredData() {
  const { state, dispatch } = useAppContext();
  const { processedData, dateRange, activeFilters } = state;

  const filteredData = useMemo(() => {
    let data = processedData;

    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      data = data.filter(e => e.timestamp >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      data = data.filter(e => e.timestamp <= endDate);
    }

    if (activeFilters.platforms.length > 0) {
      data = data.filter(e => e.platform && activeFilters.platforms.includes(e.platform));
    }

    if (activeFilters.channels.length > 0) {
      data = data.filter(e => e.channel && activeFilters.channels.includes(e.channel));
    }

    return data;
  }, [processedData, dateRange, activeFilters]);

  const filterCount = useMemo(() => {
    let count = 0;
    if (dateRange.start || dateRange.end) count++;
    count += activeFilters.platforms.length;
    count += activeFilters.channels.length;
    return count;
  }, [dateRange, activeFilters]);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, [dispatch]);

  const setDateRange = useCallback((range: DateRange) => {
    dispatch({ type: 'SET_DATE_RANGE', payload: range });
  }, [dispatch]);

  const setPlatformFilter = useCallback((platforms: string[]) => {
    dispatch({ type: 'SET_PLATFORM_FILTER', payload: platforms });
  }, [dispatch]);

  const setChannelFilter = useCallback((channels: string[]) => {
    dispatch({ type: 'SET_CHANNEL_FILTER', payload: channels });
  }, [dispatch]);

  return {
    filteredData,
    filterCount,
    clearFilters,
    setDateRange,
    setPlatformFilter,
    setChannelFilter,
    dateRange,
    activeFilters,
  };
}
