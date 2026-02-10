import { useState, useEffect, useCallback } from 'react';
import type { FRESnapshot } from '../lib/supabaseData';
import { useAuth } from '../context/AuthContext';

export function useSavedAnalyses() {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<FRESnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshots = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { listAllSnapshots } = await import('../lib/supabaseData');
      const data = await listAllSnapshots();
      setSnapshots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const removeSnapshot = useCallback(async (id: string) => {
    try {
      const { deleteSnapshot } = await import('../lib/supabaseData');
      await deleteSnapshot(id);
      setSnapshots(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    }
  }, []);

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  return { snapshots, loading, error, reload: loadSnapshots, removeSnapshot };
}
