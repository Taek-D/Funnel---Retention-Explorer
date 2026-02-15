import { useState, useCallback } from 'react';
import { blendDatasets } from '../lib/dataBlender';
import type { BlendSource, BlendStrategy, BlendResult, JoinKey } from '../lib/dataBlender';

export function useDataBlend() {
  const [sources, setSources] = useState<BlendSource[]>([]);
  const [result, setResult] = useState<BlendResult | null>(null);
  const [strategy, setStrategy] = useState<BlendStrategy>('union');
  const [joinKey, setJoinKey] = useState<JoinKey>('userid');

  const addSource = useCallback((source: BlendSource) => {
    setSources(prev => [...prev, source]);
  }, []);

  const removeSource = useCallback((index: number) => {
    setSources(prev => prev.filter((_, i) => i !== index));
    setResult(null);
  }, []);

  const blend = useCallback(() => {
    if (sources.length < 2) return null;
    const blended = blendDatasets(sources, strategy, joinKey);
    setResult(blended);
    return blended;
  }, [sources, strategy, joinKey]);

  const reset = useCallback(() => {
    setSources([]);
    setResult(null);
  }, []);

  return { sources, result, strategy, joinKey, addSource, removeSource, blend, reset, setStrategy, setJoinKey };
}
