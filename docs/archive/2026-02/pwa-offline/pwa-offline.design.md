# PWA + Offline — Design

> **Feature**: pwa-offline
> **Plan**: [pwa-offline.plan.md](../../01-plan/features/pwa-offline.plan.md)
> **Date**: 2026-02-13

---

## 1. Architecture

```
Vite Build
  └─ vite-plugin-pwa (Workbox GenerateSW)
       │
       ├─ manifest.json → Web App Manifest
       │     └─ name, icons, theme_color, display: standalone
       │
       ├─ sw.js → Service Worker (auto-generated)
       │     ├─ Precache: HTML, CSS, JS bundles (App Shell)
       │     ├─ Runtime Cache:
       │     │     ├─ /functions/v1/* → NetworkFirst (API)
       │     │     ├─ *.svg, *.png, fonts → CacheFirst (30d)
       │     │     └─ CDN (tailwind, recharts) → StaleWhileRevalidate
       │     └─ Offline Fallback: cached index.html
       │
       └─ registerSW.ts → Auto-update prompt

UI Layer
  ├─ useOnlineStatus() → navigator.onLine + events
  ├─ OfflineBanner → "오프라인 모드" top banner
  └─ InstallPrompt → beforeinstallprompt → install button
```

## 2. Implementation Tasks

### PWA-1: Web App Manifest + Icons (`public/manifest.json`)

```json
{
  "name": "FRE Analytics — 퍼널 & 리텐션 탐색기",
  "short_name": "FRE Analytics",
  "description": "CSV 데이터로 퍼널 분석, 리텐션 코호트, 세그먼트 비교, AI 인사이트",
  "start_url": "/app/dashboard",
  "scope": "/",
  "display": "standalone",
  "background_color": "#0c0f14",
  "theme_color": "#0c0f14",
  "orientation": "any",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Add to `index.html` `<head>`:

```html
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

Icons: Generate from favicon.svg using canvas or provide static PNG files.

### PWA-2: Vite PWA Plugin (`vite.config.ts`)

Install: `npm install -D vite-plugin-pwa`

```typescript
import { VitePWA } from 'vite-plugin-pwa';

// Add to plugins array:
VitePWA({
  registerType: 'prompt',
  includeAssets: ['favicon.svg', 'icons/*.png'],
  manifest: false, // Use public/manifest.json directly
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
    runtimeCaching: [
      {
        // Supabase API calls — NetworkFirst
        urlPattern: /\/functions\/v1\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 300 },
          networkTimeoutSeconds: 5,
        },
      },
      {
        // Supabase Auth / REST — NetworkFirst
        urlPattern: /\/rest\/v1\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-cache',
          expiration: { maxEntries: 30, maxAgeSeconds: 300 },
        },
      },
      {
        // CDN resources (Tailwind, fonts) — StaleWhileRevalidate
        urlPattern: /^https:\/\/cdn\./,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'cdn-cache',
          expiration: { maxEntries: 30, maxAgeSeconds: 86400 * 7 },
        },
      },
      {
        // Image assets — CacheFirst
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 86400 * 30 },
        },
      },
    ],
  },
})
```

### PWA-3: Offline Status (`hooks/useOnlineStatus.ts`)

```typescript
import { useState, useEffect } from 'react';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

### PWA-3b: Offline Banner (`components/OfflineBanner.tsx`)

```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff } from '../components/Icons';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/90 text-background text-xs font-medium text-center py-1.5 flex items-center justify-center gap-1.5">
      <WifiOff size={14} />
      {t('pwa.offlineMode')}
    </div>
  );
};
```

Place in `AppShell.tsx` (inside the layout, before children).

### PWA-4: Install Prompt (`hooks/useInstallPrompt.ts`)

```typescript
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return { canInstall: !!deferredPrompt && !isInstalled, isInstalled, install };
}
```

### PWA-4b: Install Banner in Sidebar

Add install button at bottom of Sidebar (before logout):

```typescript
const { canInstall, install } = useInstallPrompt();
// ...
{canInstall && (
  <button onClick={install} className="...">
    <Download size={16} /> {t('pwa.installApp')}
  </button>
)}
```

### PWA-4c: SW Update Prompt (`components/UpdatePrompt.tsx`)

```typescript
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const UpdatePrompt: React.FC = () => {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-surface border border-white/[0.08] rounded-xl p-4 shadow-lg max-w-xs">
      <p className="text-sm text-white mb-3">{t('pwa.updateAvailable')}</p>
      <button
        onClick={() => updateServiceWorker(true)}
        className="px-4 py-1.5 text-xs font-semibold bg-accent text-background rounded-md hover:bg-accent/90"
      >
        {t('pwa.updateNow')}
      </button>
    </div>
  );
};
```

Place in `index.tsx` (top-level, always visible).

### PWA-5: i18n Keys

Add to `locales/ko/common.json` under `pwa`:

```json
{
  "pwa": {
    "installApp": "앱 설치",
    "installHint": "홈 화면에 추가하여 빠르게 접근하세요",
    "offlineMode": "오프라인 모드 — 일부 기능이 제한됩니다",
    "updateAvailable": "새 버전이 있습니다",
    "updateNow": "업데이트",
    "installed": "앱이 설치되었습니다"
  }
}
```

Corresponding English keys in `locales/en/common.json`.

## 3. Dependencies

- **New npm (dev)**: `vite-plugin-pwa` (Workbox Service Worker generator)
- **New files**: manifest.json, icons/, useOnlineStatus, useInstallPrompt, OfflineBanner, UpdatePrompt
- **Modified**: vite.config.ts, index.html, AppShell, Sidebar, index.tsx, i18n files

## 4. Implementation Order

1. PWA-1: Manifest + icons (foundation)
2. PWA-2: vite-plugin-pwa setup (service worker)
3. PWA-3: Offline status hook + banner
4. PWA-4: Install prompt hook + Sidebar button + Update prompt
5. PWA-5: i18n keys

## 5. Verification Checklist

- [ ] PWA-1: manifest.json with correct name, icons, display: standalone
- [ ] PWA-1: index.html has manifest link + apple-touch-icon
- [ ] PWA-1: Icon files exist (192, 512, 512-maskable)
- [ ] PWA-2: vite-plugin-pwa installed and configured
- [ ] PWA-2: Workbox runtimeCaching rules (API NetworkFirst, images CacheFirst, CDN StaleWhileRevalidate)
- [ ] PWA-2: registerType: 'prompt' configured
- [ ] PWA-3: useOnlineStatus hook with online/offline events
- [ ] PWA-3: OfflineBanner component in AppShell
- [ ] PWA-4: useInstallPrompt hook with beforeinstallprompt
- [ ] PWA-4: Install button in Sidebar
- [ ] PWA-4: UpdatePrompt component with useRegisterSW
- [ ] PWA-5: i18n keys added (ko + en, ~6 keys each)
