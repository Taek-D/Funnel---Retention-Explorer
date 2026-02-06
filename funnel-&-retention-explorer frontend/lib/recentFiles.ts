import type { RecentFile } from '../types';

const STORAGE_KEY = 'recentFiles';
const MAX_FILES = 5;

export function loadRecentFiles(): RecentFile[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveRecentFile(fileInfo: RecentFile): void {
  let recentFiles = loadRecentFiles();
  recentFiles = recentFiles.filter(f => f.fileName !== fileInfo.fileName);
  recentFiles.unshift(fileInfo);
  recentFiles = recentFiles.slice(0, MAX_FILES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recentFiles));
}

export function removeRecentFile(index: number): RecentFile[] {
  const recentFiles = loadRecentFiles();
  recentFiles.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recentFiles));
  return recentFiles;
}
