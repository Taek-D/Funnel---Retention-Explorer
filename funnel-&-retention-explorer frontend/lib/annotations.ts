const STORAGE_PREFIX = 'fre_annotations_';

export type AnnotationCategory = 'release' | 'campaign' | 'incident' | 'custom';

export interface ChartAnnotation {
  id: string;
  date: string;
  label: string;
  color: string;
  category: AnnotationCategory;
}

export const ANNOTATION_CATEGORIES: AnnotationCategory[] = ['release', 'campaign', 'incident', 'custom'];

export const ANNOTATION_COLORS: Record<AnnotationCategory, string> = {
  release: '#22c55e',
  campaign: '#3b82f6',
  incident: '#ef4444',
  custom: '#a855f7',
};

export function getAnnotations(chartKey: string): ChartAnnotation[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + chartKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAnnotations(chartKey: string, annotations: ChartAnnotation[]): void {
  localStorage.setItem(STORAGE_PREFIX + chartKey, JSON.stringify(annotations));
}

export function addAnnotation(chartKey: string, annotation: Omit<ChartAnnotation, 'id'>): ChartAnnotation {
  const list = getAnnotations(chartKey);
  const newItem: ChartAnnotation = { ...annotation, id: crypto.randomUUID() };
  list.push(newItem);
  saveAnnotations(chartKey, list);
  return newItem;
}

export function removeAnnotation(chartKey: string, id: string): void {
  const list = getAnnotations(chartKey).filter(a => a.id !== id);
  saveAnnotations(chartKey, list);
}
