import type { RecentFile } from '../types';
import { RECENT_FILES_MAX_COUNT } from './constants';

const STORAGE_KEY = 'recentFiles';

export function loadRecentFiles(): RecentFile[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecentFile(fileInfo: RecentFile): void {
  let recentFiles = loadRecentFiles();
  recentFiles = recentFiles.filter(f => f.fileName !== fileInfo.fileName);
  recentFiles.unshift(fileInfo);
  recentFiles = recentFiles.slice(0, RECENT_FILES_MAX_COUNT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recentFiles));
}

export function removeRecentFile(index: number): RecentFile[] {
  const recentFiles = loadRecentFiles();
  recentFiles.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recentFiles));
  return recentFiles;
}
