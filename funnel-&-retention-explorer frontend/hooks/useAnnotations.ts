import { useState, useCallback } from 'react';
import {
  getAnnotations,
  addAnnotation as addToStorage,
  removeAnnotation as removeFromStorage,
} from '../lib/annotations';
import type { ChartAnnotation, AnnotationCategory } from '../lib/annotations';
import { ANNOTATION_COLORS } from '../lib/annotations';

export function useAnnotations(chartKey: string) {
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>(() => getAnnotations(chartKey));

  const add = useCallback((date: string, label: string, category: AnnotationCategory) => {
    const created = addToStorage(chartKey, {
      date,
      label,
      category,
      color: ANNOTATION_COLORS[category],
    });
    setAnnotations(prev => [...prev, created]);
    return created;
  }, [chartKey]);

  const remove = useCallback((id: string) => {
    removeFromStorage(chartKey, id);
    setAnnotations(prev => prev.filter(a => a.id !== id));
  }, [chartKey]);

  return { annotations, add, remove };
}
