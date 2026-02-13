# PWA + Offline Plan

## Overview
FRE Analytics를 Progressive Web App(PWA)으로 전환하여 모바일/데스크톱에서 앱 설치, 오프라인 접근, 빠른 로딩을 지원합니다.
Vite PWA 플러그인을 활용해 Service Worker, Web App Manifest, 캐시 전략을 구현합니다.

## Current State
- SPA (Vite + React): 온라인 전용, 새로고침 시 항상 서버 요청
- manifest.json: 없음
- Service Worker: 없음
- 앱 설치: 불가능
- 오프라인: 완전 불가 (빈 화면)
- 아이콘: favicon.svg만 존재 (PWA 아이콘 없음)

## Scope

### PWA-1: Web App Manifest + Icons (LOW effort, HIGH impact)
- `public/manifest.json` 생성 (name, icons, theme_color, display: standalone)
- PWA 아이콘 생성: 192x192, 512x512 (SVG → PNG 변환 또는 SVG 아이콘 직접 사용)
- index.html에 manifest 링크 + apple-touch-icon 메타 태그 추가
- theme-color, background_color 설정 (#0c0f14 다크 테마)

### PWA-2: Vite PWA Plugin + Service Worker (MED effort, HIGH impact)
- `vite-plugin-pwa` 설치 및 설정
- Service Worker 전략: GenerateSW (Workbox 기반 자동 생성)
- 캐시 전략:
  - App Shell (HTML/CSS/JS): CacheFirst
  - API 호출 (Supabase): NetworkFirst
  - 이미지/폰트: CacheFirst (30일 TTL)
- 자동 업데이트: prompt 방식 (새 버전 감지 시 사용자에게 알림)

### PWA-3: Offline Fallback UI (LOW effort, MED impact)
- 오프라인 상태 감지 (navigator.onLine + online/offline 이벤트)
- useOnlineStatus 커스텀 훅
- 오프라인 배너: 상단에 "오프라인 모드" 알림 표시
- 오프라인 시 Supabase 호출 차단 (로컬 데이터만 사용)

### PWA-4: Install Prompt (LOW effort, MED impact)
- beforeinstallprompt 이벤트 캡처
- 앱 설치 유도 배너/버튼 (Sidebar 하단 또는 설정)
- 설치 후 배너 숨김 (display-mode: standalone 감지)
- i18n 키 추가

### PWA-5: i18n Keys (LOW effort, LOW impact)
- PWA 관련 한국어/영어 키 추가 (~10개)

## Non-Scope
- IndexedDB 기반 오프라인 데이터 동기화 — 별도 PDCA
- Background Sync (오프라인 작업 큐) — 별도 PDCA
- Push Notifications (Web Push API) — 별도 PDCA

## Success Criteria
- Lighthouse PWA 점수 100
- Chrome/Edge에서 "앱 설치" 프롬프트 표시
- 오프라인 시 캐시된 App Shell 표시 + 오프라인 배너
- 310+ 테스트 통과
