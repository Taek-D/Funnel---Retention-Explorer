# Bundle Optimization Design Document

> **Summary**: Vite manualChunks + React.lazy + dynamic import으로 1,013KB → 목표 각 chunk < 500KB
>
> **Project**: Funnel & Retention Explorer
> **Version**: 0.0.0
> **Author**: PDCA Phase 3
> **Date**: 2026-02-09
> **Status**: Draft
> **Planning Doc**: [bundle-optimization.plan.md](../../01-plan/features/bundle-optimization.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. 단일 1,013KB 번들을 여러 chunk로 분리하여 각 chunk < 500KB 달성
2. 랜딩 페이지 초기 로드에 불필요한 앱 코드 제거 (route-level code splitting)
3. 사용 빈도 낮은 모듈을 on-demand loading으로 전환
4. 기존 기능, 테스트, 라우팅 동작 100% 유지

### 1.2 Design Principles

- **최소 변경 원칙**: 기존 컴포넌트 내부 로직 변경 없음 (import 패턴만 변경)
- **점진적 로딩**: 사용자가 접근하는 페이지만 로드
- **캐시 효율**: vendor 라이브러리와 앱 코드를 분리하여 독립적 캐시 무효화

---

## 2. Architecture

### 2.1 Before (Current)

```
index.html
  └── index-Di-6w75L.js (1,013KB)  ← 모든 코드가 단일 파일
       ├── react + react-dom
       ├── react-router-dom
       ├── recharts
       ├── @supabase/supabase-js
       ├── papaparse
       ├── lucide-react
       └── All pages + components + lib
```

### 2.2 After (Target)

```
index.html
  ├── vendor-react-[hash].js      ← react, react-dom, react-router-dom
  ├── vendor-charts-[hash].js     ← recharts
  ├── vendor-supabase-[hash].js   ← @supabase/supabase-js
  ├── vendor-data-[hash].js       ← papaparse
  ├── index-[hash].js             ← entry + LandingPage + core framework
  ├── LoginPage-[hash].js         ← lazy loaded
  ├── SignupPage-[hash].js        ← lazy loaded
  ├── Dashboard-[hash].js         ← lazy loaded
  ├── DataImport-[hash].js        ← lazy loaded
  ├── FunnelAnalysis-[hash].js    ← lazy loaded
  ├── RetentionAnalysis-[hash].js ← lazy loaded
  ├── SegmentComparison-[hash].js ← lazy loaded
  └── Insights-[hash].js          ← lazy loaded
```

### 2.3 Loading Strategy

| Route | Chunks Loaded | When |
|-------|--------------|------|
| `/` (Landing) | index + vendor-react | Immediate |
| `/login` | + LoginPage chunk | On navigate |
| `/app/dashboard` | + Dashboard + vendor-charts + vendor-supabase | On navigate |
| `/app/upload` | + DataImport + vendor-data | On navigate |
| `/app/funnels` | + FunnelAnalysis + vendor-charts | On navigate (cached) |
| Export report | + reportEngine (dynamic) | On button click |
| AI insights | + geminiClient (dynamic) | On button click |

---

## 3. Detailed Design

### 3.1 Task B1: vite.config.ts — manualChunks 설정

**File**: `vite.config.ts`

**Before (현재 코드 전체)**:
```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
```

**After (추가할 `build` 섹션)**:
```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) {
                  return 'vendor-react';
                }
                if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
                  return 'vendor-charts';
                }
                if (id.includes('@supabase')) {
                  return 'vendor-supabase';
                }
                if (id.includes('papaparse')) {
                  return 'vendor-data';
                }
              }
            }
          }
        }
      }
    };
});
```

**Check Items**:
- [ ] B1.1: `build.rollupOptions.output.manualChunks` 함수가 존재
- [ ] B1.2: `vendor-react` chunk에 react, react-dom, react-router-dom 포함
- [ ] B1.3: `vendor-charts` chunk에 recharts + d3 관련 패키지 포함
- [ ] B1.4: `vendor-supabase` chunk에 @supabase 패키지 포함
- [ ] B1.5: `vendor-data` chunk에 papaparse 포함
- [ ] B1.6: 빌드 성공 (`vite build` 에러 없음)

---

### 3.2 Task B2: router.tsx — React.lazy + Suspense 적용

**File**: `router.tsx`

**Before (현재 코드 전체)**:
```tsx
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';

import { Dashboard } from './pages/Dashboard';
import { DataImport } from './pages/DataImport';
import { FunnelAnalysis } from './pages/FunnelAnalysis';
import { RetentionAnalysis } from './pages/RetentionAnalysis';
import { SegmentComparison } from './pages/SegmentComparison';
import { Insights } from './pages/Insights';

export const router = createBrowserRouter([...]);
```

**After**:
```tsx
import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { LandingPage } from './pages/LandingPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { PageLoader } from './components/PageLoader';

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const DataImport = lazy(() => import('./pages/DataImport').then(m => ({ default: m.DataImport })));
const FunnelAnalysis = lazy(() => import('./pages/FunnelAnalysis').then(m => ({ default: m.FunnelAnalysis })));
const RetentionAnalysis = lazy(() => import('./pages/RetentionAnalysis').then(m => ({ default: m.RetentionAnalysis })));
const SegmentComparison = lazy(() => import('./pages/SegmentComparison').then(m => ({ default: m.SegmentComparison })));
const Insights = lazy(() => import('./pages/Insights').then(m => ({ default: m.Insights })));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>,
  },
  {
    path: '/signup',
    element: <Suspense fallback={<PageLoader />}><SignupPage /></Suspense>,
  },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <Suspense fallback={<PageLoader />}><Dashboard /></Suspense> },
          { path: 'upload', element: <Suspense fallback={<PageLoader />}><DataImport /></Suspense> },
          { path: 'funnels', element: <Suspense fallback={<PageLoader />}><FunnelAnalysis /></Suspense> },
          { path: 'retention', element: <Suspense fallback={<PageLoader />}><RetentionAnalysis /></Suspense> },
          { path: 'segments', element: <Suspense fallback={<PageLoader />}><SegmentComparison /></Suspense> },
          { path: 'insights', element: <Suspense fallback={<PageLoader />}><Insights /></Suspense> },
        ],
      },
    ],
  },
]);
```

**Design Notes**:
- `LandingPage`는 entry point이므로 즉시 로드 (lazy 제외)
- `ProtectedRoute`와 `AppShell`은 앱 레이아웃이므로 즉시 로드
- 각 페이지 컴포넌트는 `named export`를 사용하므로 `.then(m => ({ default: m.XXX }))` 패턴 필요
- `<Suspense>` fallback에 `<PageLoader />` 컴포넌트 사용

**Check Items**:
- [ ] B2.1: `LandingPage`는 static import 유지
- [ ] B2.2: `ProtectedRoute`, `AppShell`은 static import 유지
- [ ] B2.3: `LoginPage`가 `lazy()` + `.then(m => ({ default: m.LoginPage }))` 패턴 사용
- [ ] B2.4: `SignupPage`가 `lazy()` + `.then()` 패턴 사용
- [ ] B2.5: `Dashboard`가 `lazy()` + `.then()` 패턴 사용
- [ ] B2.6: `DataImport`가 `lazy()` + `.then()` 패턴 사용
- [ ] B2.7: `FunnelAnalysis`가 `lazy()` + `.then()` 패턴 사용
- [ ] B2.8: `RetentionAnalysis`가 `lazy()` + `.then()` 패턴 사용
- [ ] B2.9: `SegmentComparison`가 `lazy()` + `.then()` 패턴 사용
- [ ] B2.10: `Insights`가 `lazy()` + `.then()` 패턴 사용
- [ ] B2.11: 모든 lazy 컴포넌트가 `<Suspense fallback={<PageLoader />}>` 로 감싸짐
- [ ] B2.12: `PageLoader` import 존재

---

### 3.3 Task B3: PageLoader 컴포넌트 생성

**File**: `components/PageLoader.tsx` (신규)

```tsx
import React from 'react';

export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      <span className="text-xs text-slate-500">로딩 중...</span>
    </div>
  </div>
);
```

**Design Notes**:
- Tailwind CSS만 사용 (인라인 스타일 금지)
- `min-h-[60vh]`로 AppShell 내부 콘텐츠 영역에서 중앙 배치
- 기존 디자인 시스템의 `text-accent` 색상 사용
- `animate-spin`은 Tailwind 내장 유틸리티

**Check Items**:
- [ ] B3.1: `components/PageLoader.tsx` 파일 존재
- [ ] B3.2: `PageLoader`가 named export
- [ ] B3.3: Tailwind CSS 클래스만 사용 (인라인 스타일 없음)
- [ ] B3.4: `animate-spin` 스피너 포함
- [ ] B3.5: 한국어 텍스트 "로딩 중..." 포함

---

### 3.4 Task B4: useExportReport.ts — reportEngine dynamic import

**File**: `hooks/useExportReport.ts`

**Before (line 5)**:
```typescript
import { exportReportAsPNG } from '../lib/reportEngine';
```

**After**: top-level import 제거, 함수 내부에서 dynamic import

```typescript
// (line 5의 import 문 삭제)

// exportReport 콜백 내부 (기존 line 22~23):
// Before:
//   await exportReportAsPNG(state);
// After:
      const { exportReportAsPNG } = await import('../lib/reportEngine');
      await exportReportAsPNG(state);
```

**전체 After 코드**:
```typescript
import { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { useNotifications } from '../context/NotificationContext';

export function useExportReport() {
  const { state } = useAppContext();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const [exporting, setExporting] = useState(false);

  const exportReport = useCallback(async () => {
    if (state.processedData.length === 0) {
      toast('warning', '데이터 없음', '리포트를 생성하려면 먼저 데이터를 업로드하세요.');
      return;
    }

    setExporting(true);
    toast('info', '리포트 생성 중...', 'PNG 파일을 다운로드합니다.');

    try {
      const { exportReportAsPNG } = await import('../lib/reportEngine');
      await exportReportAsPNG(state);
      toast('success', '리포트 내보내기 완료');
      addNotification('export', '리포트 내보내기 완료', 'PNG 파일이 다운로드되었습니다.');
    } catch (err) {
      toast('error', '리포트 생성 실패', err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setExporting(false);
    }
  }, [state, toast, addNotification]);

  return { exportReport, exporting };
}
```

**Check Items**:
- [ ] B4.1: `import { exportReportAsPNG } from '../lib/reportEngine'` top-level import 제거됨
- [ ] B4.2: `await import('../lib/reportEngine')` dynamic import가 try 블록 내부에 존재
- [ ] B4.3: destructuring으로 `exportReportAsPNG` 추출
- [ ] B4.4: 나머지 로직 (toast, setExporting 등) 변경 없음

---

### 3.5 Task B5: useAIInsights.ts — geminiClient dynamic import

**File**: `hooks/useAIInsights.ts`

**Before (line 3)**:
```typescript
import { generateContent, buildAnalysisPrompt, type GeminiMessage } from '../lib/geminiClient';
```

**After**: type import는 유지, 런타임 함수만 dynamic import

```typescript
import type { GeminiMessage } from '../lib/geminiClient';
```

**변경 위치 — generateSummary 함수 내부 (기존 line 57~60)**:
```typescript
// Before:
    const dataContext = getDataContext();
    const prompt = `${dataContext}\n\n...`;
    const result = await generateContent(prompt, SYSTEM_INSTRUCTION);

// After:
    const { generateContent, buildAnalysisPrompt } = await import('../lib/geminiClient');
    const dataContext = getDataContext();
    const prompt = `${dataContext}\n\n...`;
    const result = await generateContent(prompt, SYSTEM_INSTRUCTION);
```

**변경 위치 — getDataContext 함수 (기존 line 21~45)**:

`getDataContext`는 `buildAnalysisPrompt`를 호출합니다. dynamic import로 전환 시 `getDataContext`가 async가 되어야 하므로, 대안으로 `buildAnalysisPrompt`를 `generateSummary`와 `askQuestion` 내부로 이동합니다.

**전체 After 코드**:
```typescript
import { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNotifications } from '../context/NotificationContext';
import type { GeminiMessage } from '../lib/geminiClient';

const SYSTEM_INSTRUCTION = `You are an expert data analyst for FRE Analytics, a SaaS analytics platform.
Your job is to provide actionable insights based on funnel, retention, and segment analysis data.
Always be concise and data-driven. Format your response with clear headings and bullet points.
If the data seems insufficient, explain what additional data would help.
Always respond in Korean (한국어).`;

export function useAIInsights() {
  const { state, dispatch } = useAppContext();
  const { addNotification } = useNotifications();
  const aiSummary = state.aiSummary;
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<GeminiMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);

  const generateSummary = useCallback(async () => {
    if (state.processedData.length === 0) {
      setAiError('No data available. Upload and process data first.');
      return;
    }

    setAiLoading(true);
    setAiError('');

    const { generateContent, buildAnalysisPrompt } = await import('../lib/geminiClient');

    const dataContext = buildAnalysisPrompt({
      datasetType: state.detectedType,
      totalUsers: state.dataQualityReport?.uniqueUsers || 0,
      totalEvents: state.processedData.length,
      uniqueEvents: state.uniqueEvents,
      funnelSteps: state.funnelSteps,
      funnelConversion: state.funnelResults && state.funnelResults.length > 1
        ? (state.funnelResults[state.funnelResults.length - 1].users / state.funnelResults[0].users) * 100
        : null,
      retentionDay1: state.retentionResults?.[0]?.days['D1'] ?? null,
      retentionDay7: state.retentionResults?.[0]?.days['D7'] ?? null,
      topInsights: state.insights.slice(0, 5).map(i => `[${i.type}] ${i.title}: ${i.body}`),
      subscriptionKPIs: state.subscriptionKPIs,
    });

    const prompt = `${dataContext}\n\nBased on this data, provide a comprehensive analysis summary with:\n1. Key findings (top 3-5 observations)\n2. Areas of concern\n3. Recommended actions\n4. What additional data would help deepen the analysis`;

    const result = await generateContent(prompt, SYSTEM_INSTRUCTION);

    if (result.error) {
      setAiError(result.error);
    } else {
      dispatch({ type: 'SET_AI_SUMMARY', payload: result.text });
      addNotification('ai', 'AI 분석 완료', '대시보드에서 AI 요약을 확인하세요.');
    }

    setAiLoading(false);
  }, [state, addNotification, dispatch]);

  const askQuestion = useCallback(async (question: string) => {
    if (!question.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', text: question }]);

    const { generateContent, buildAnalysisPrompt } = await import('../lib/geminiClient');

    const dataContext = buildAnalysisPrompt({
      datasetType: state.detectedType,
      totalUsers: state.dataQualityReport?.uniqueUsers || 0,
      totalEvents: state.processedData.length,
      uniqueEvents: state.uniqueEvents,
      funnelSteps: state.funnelSteps,
      funnelConversion: state.funnelResults && state.funnelResults.length > 1
        ? (state.funnelResults[state.funnelResults.length - 1].users / state.funnelResults[0].users) * 100
        : null,
      retentionDay1: state.retentionResults?.[0]?.days['D1'] ?? null,
      retentionDay7: state.retentionResults?.[0]?.days['D7'] ?? null,
      topInsights: state.insights.slice(0, 5).map(i => `[${i.type}] ${i.title}: ${i.body}`),
      subscriptionKPIs: state.subscriptionKPIs,
    });

    const fullPrompt = `${dataContext}\n\nUser question: ${question}`;

    const result = await generateContent(fullPrompt, SYSTEM_INSTRUCTION, chatHistory);

    if (result.error) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Error: ${result.error}` }]);
    } else {
      setChatMessages(prev => [...prev, { role: 'assistant', text: result.text }]);
      setChatHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: fullPrompt }] },
        { role: 'model', parts: [{ text: result.text }] },
      ]);
    }
  }, [state, chatHistory]);

  const clearChat = useCallback(() => {
    setChatMessages([]);
    setChatHistory([]);
  }, []);

  return {
    aiSummary,
    aiLoading,
    aiError,
    generateSummary,
    chatMessages,
    askQuestion,
    clearChat,
    hasData: state.processedData.length > 0,
  };
}
```

**Design Notes**:
- `type GeminiMessage` import는 `import type`으로 유지 (런타임에 영향 없음)
- `getDataContext` 콜백을 제거하고, `buildAnalysisPrompt` 호출을 `generateSummary`와 `askQuestion` 내부에 인라인
- `buildAnalysisPrompt`는 데이터를 포맷하는 순수함수이므로 인라인해도 무해

**Check Items**:
- [ ] B5.1: top-level `import { generateContent, buildAnalysisPrompt, type GeminiMessage }` 제거됨
- [ ] B5.2: `import type { GeminiMessage }` 만 남음
- [ ] B5.3: `generateSummary` 내부에 `await import('../lib/geminiClient')` 존재
- [ ] B5.4: `askQuestion` 내부에 `await import('../lib/geminiClient')` 존재
- [ ] B5.5: `getDataContext` 콜백 제거 → `buildAnalysisPrompt` 인라인 호출
- [ ] B5.6: `SYSTEM_INSTRUCTION` 상수 변경 없음
- [ ] B5.7: return 값 인터페이스 변경 없음 (기존 API 유지)

---

### 3.6 Task B6: 빌드 검증

**검증 명령어**:

```bash
# 1. 빌드 성공 확인
node node_modules/vite/bin/vite.js build

# 2. 테스트 통과 확인
npx vitest run
```

**Check Items**:
- [ ] B6.1: `vite build` 에러 없이 성공
- [ ] B6.2: Vite 500KB 경고 없음 (모든 chunk < 500KB)
- [ ] B6.3: 빌드 출력에 여러 chunk 파일 표시 (vendor-react, vendor-charts 등)
- [ ] B6.4: `npx vitest run` 기존 테스트 98/98 통과

---

## 4. Implementation Order

| # | Task | File(s) | Depends On |
|---|------|---------|-----------|
| 1 | B3: PageLoader 컴포넌트 생성 | `components/PageLoader.tsx` | None |
| 2 | B1: vite.config.ts manualChunks | `vite.config.ts` | None |
| 3 | B2: router.tsx lazy loading | `router.tsx` | B3 (PageLoader) |
| 4 | B4: useExportReport dynamic import | `hooks/useExportReport.ts` | None |
| 5 | B5: useAIInsights dynamic import | `hooks/useAIInsights.ts` | None |
| 6 | B6: Build verification | N/A | B1~B5 |

**병렬 가능**: B1, B3, B4, B5는 독립적으로 병렬 구현 가능. B2는 B3에 의존. B6은 전체 완료 후.

---

## 5. Files Summary

### 5.1 New Files

| File | Lines (est.) | Purpose |
|------|-------------|---------|
| `components/PageLoader.tsx` | ~10 | Suspense fallback 스피너 컴포넌트 |

### 5.2 Modified Files

| File | Changes | Impact |
|------|---------|--------|
| `vite.config.ts` | `build.rollupOptions.output.manualChunks` 추가 | Vendor chunk 분리 |
| `router.tsx` | Static import → `React.lazy()` + `<Suspense>` 전환 | 페이지 code splitting |
| `hooks/useExportReport.ts` | Top-level import → dynamic `await import()` | reportEngine 지연 로드 |
| `hooks/useAIInsights.ts` | Top-level import → `import type` + dynamic `await import()` | geminiClient 지연 로드 |

**Total**: 1 new file, 4 modified files

---

## 6. Success Criteria

| Metric | Before | Target | Check Method |
|--------|--------|--------|-------------|
| Total chunks | 1 | 6+ | `vite build` 출력 |
| Largest chunk | 1,013KB | < 500KB | `vite build` 출력 |
| Vite >500KB 경고 | Yes | No | `vite build` 출력 |
| Tests passing | 98/98 | 98/98 | `npx vitest run` |
| Build success | Yes | Yes | `vite build` exit code 0 |

---

## 7. Check Items Summary

| Task | Check Items | Count |
|------|------------|:-----:|
| B1: manualChunks | B1.1 ~ B1.6 | 6 |
| B2: React.lazy router | B2.1 ~ B2.12 | 12 |
| B3: PageLoader | B3.1 ~ B3.5 | 5 |
| B4: useExportReport | B4.1 ~ B4.4 | 4 |
| B5: useAIInsights | B5.1 ~ B5.7 | 7 |
| B6: Build verification | B6.1 ~ B6.4 | 4 |
| **Total** | | **38** |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-09 | Initial draft | PDCA Phase 3 |
