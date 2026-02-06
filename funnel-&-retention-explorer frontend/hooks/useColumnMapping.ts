import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import type { ColumnMapping } from '../types';

export function useColumnMapping() {
  const { state } = useAppContext();
  const [mapping, setMapping] = useState<ColumnMapping>(state.columnMapping);

  useEffect(() => {
    setMapping(state.columnMapping);
  }, [state.columnMapping]);

  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    setMapping(prev => ({ ...prev, [field]: value || undefined }));
  };

  return {
    mapping,
    setMapping,
    updateMapping,
    headers: state.headers,
    rawData: state.rawData
  };
}
