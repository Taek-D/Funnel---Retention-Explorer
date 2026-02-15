export function isBetaMode(): boolean {
  return import.meta.env.VITE_BETA_MODE === 'true';
}

export const BETA_END_DATE = '2026-04-30';

export function isBetaExpired(): boolean {
  if (!isBetaMode()) return false;
  return new Date() > new Date(BETA_END_DATE);
}

export function isBetaActive(): boolean {
  return isBetaMode() && !isBetaExpired();
}
