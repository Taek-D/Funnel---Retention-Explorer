import { useState, useCallback } from 'react';
import { getSavedViews, addSavedView, removeSavedView } from '../lib/savedViews';
import type { SavedView } from '../lib/savedViews';

export function useSavedViews() {
  const [views, setViews] = useState<SavedView[]>(() => getSavedViews());

  const save = useCallback((view: Omit<SavedView, 'id' | 'createdAt'>) => {
    const created = addSavedView(view);
    setViews(getSavedViews());
    return created;
  }, []);

  const remove = useCallback((id: string) => {
    removeSavedView(id);
    setViews(getSavedViews());
  }, []);

  return { views, save, remove };
}
