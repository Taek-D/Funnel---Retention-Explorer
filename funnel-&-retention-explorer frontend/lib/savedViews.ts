const STORAGE_KEY = 'fre_saved_views';

export interface SavedView {
  id: string;
  name: string;
  path: string;
  dateRange: { start: string; end: string } | null;
  filters: Record<string, string[]>;
  createdAt: string;
}

export function getSavedViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedView =>
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.path === 'string' &&
        typeof item.createdAt === 'string',
    );
  } catch {
    return [];
  }
}

function persist(views: SavedView[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
}

export function addSavedView(view: Omit<SavedView, 'id' | 'createdAt'>): SavedView {
  const list = getSavedViews();
  const newView: SavedView = {
    ...view,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  list.unshift(newView);
  if (list.length > 20) list.pop();
  persist(list);
  return newView;
}

export function removeSavedView(id: string): void {
  const list = getSavedViews().filter(v => v.id !== id);
  persist(list);
}
