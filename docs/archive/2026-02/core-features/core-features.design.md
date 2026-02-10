# Core Features Enhancement — Design

> **Feature**: Phase 4 Core Features (MONETIZATION-ROADMAP.md)
> **Plan**: `docs/01-plan/features/core-features.plan.md`
> **Status**: Design
> **Created**: 2026-02-10

---

## 1. CF-4: Free 워터마크 추가

> 실행 순서 1번 — reportEngine 기반 수정, CF-1과 함께 적용

### 1.1 파일: `lib/reportEngine.ts` (수정)

#### 1.1.1 `renderReportPages` 시그니처 변경

```typescript
// Before
export function renderReportPages(snapshot: ReportSnapshot): HTMLCanvasElement[]

// After
export function renderReportPages(snapshot: ReportSnapshot, isPro?: boolean): HTMLCanvasElement[]
```

- `isPro` 기본값 `false` (미전달 시 워터마크 표시)

#### 1.1.2 `drawWatermark` 함수 추가

```typescript
function drawWatermark(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  ctx.translate(PAGE_W / 2, PAGE_H / 2);
  ctx.rotate(-Math.PI / 6); // -30도 회전
  ctx.textAlign = 'center';
  ctx.fillText('FRE Analytics — Free Plan', 0, 0);
  ctx.restore();
}
```

**적용 위치**: `renderReportPages` 함수 내 각 페이지 Canvas 생성 직후, 콘텐츠 렌더링 이후 마지막에 호출

```typescript
export function renderReportPages(snapshot: ReportSnapshot, isPro = false): HTMLCanvasElement[] {
  // ... 기존 페이지 렌더링 로직 ...

  // 각 페이지 push 전에 워터마크 삽입
  if (!isPro) {
    drawWatermark(c1);
  }
  pages.push(p1);

  // ... Page 2, Page 3+ 동일 패턴 ...
}
```

#### 1.1.3 `exportReportAsPNG` 시그니처 변경

```typescript
// Before
export async function exportReportAsPNG(state: AppState): Promise<void>

// After
export async function exportReportAsPNG(state: AppState, isPro?: boolean): Promise<void>
```

내부에서 `renderReportPages(snapshot, isPro)` 호출로 전달.

#### 1.1.4 호출 변경점

`hooks/useExportReport.ts`에서 `isPro` 전달:

```typescript
const { exportReportAsPNG } = await import('../lib/reportEngine');
await exportReportAsPNG(state, isPro);
```

`useExportReport` 훅이 `usePlanGate`의 `isPro`를 참조해야 함 → CF-1에서 함께 처리.

---

## 2. CF-1: PDF 리포트 내보내기 (Pro 전용)

> 실행 순서 2번 — reportEngine 수정 완료 후

### 2.1 파일: `package.json` (수정)

```bash
npm install jspdf
```

- `jspdf` (~290KB gzipped)
- dynamic import로 main bundle에 포함되지 않음

### 2.2 파일: `lib/reportEngine.ts` (수정)

#### 2.2.1 `exportReportAsPDF` 함수 추가

```typescript
export async function exportReportAsPDF(state: AppState, isPro = false): Promise<void> {
  const snapshot = buildReportSnapshot(state);
  const pages = renderReportPages(snapshot, isPro);

  // Dynamic import — bundle splitting
  const { jsPDF } = await import('jspdf');

  // A4 landscape에 근사한 비율 (1240x1754 → portrait A4)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [PAGE_W, PAGE_H],
  });

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage([PAGE_W, PAGE_H]);

    const canvas = pages[i];
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_W, PAGE_H);
  }

  pdf.save('fre-report.pdf');
}
```

**핵심 결정**:
- Canvas → JPEG → PDF 방식 (기존 렌더링 100% 재활용)
- JPEG 품질 0.92 (PNG 대비 파일 크기 ~60% 절감)
- jsPDF `format`에 캔버스 크기 직접 지정 → 여백/스케일링 이슈 없음
- `pdf.save()` — 브라우저 기본 다운로드 (iOS Safari에서도 동작)

### 2.3 파일: `hooks/useExportReport.ts` (수정)

#### 2.3.1 포맷 선택 지원

```typescript
import { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { useNotifications } from '../context/NotificationContext';
import { usePlanGate } from './usePlanGate';

type ExportFormat = 'png' | 'pdf';

export function useExportReport() {
  const { state } = useAppContext();
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { isPro, openUpgradeModal } = usePlanGate();
  const [exporting, setExporting] = useState(false);

  const exportReport = useCallback(async (format: ExportFormat = 'png') => {
    if (state.processedData.length === 0) {
      toast('warning', '데이터 없음', '리포트를 생성하려면 먼저 데이터를 업로드하세요.');
      return;
    }

    // PDF는 Pro 전용
    if (format === 'pdf' && !isPro) {
      openUpgradeModal('PDF 리포트 내보내기는 Pro 요금제에서 사용할 수 있습니다.');
      return;
    }

    setExporting(true);
    const label = format === 'pdf' ? 'PDF' : 'PNG';
    toast('info', '리포트 생성 중...', `${label} 파일을 다운로드합니다.`);

    try {
      if (format === 'pdf') {
        const { exportReportAsPDF } = await import('../lib/reportEngine');
        await exportReportAsPDF(state, isPro);
      } else {
        const { exportReportAsPNG } = await import('../lib/reportEngine');
        await exportReportAsPNG(state, isPro);
      }
      toast('success', '리포트 내보내기 완료');
      addNotification('export', '리포트 내보내기 완료', `${label} 파일이 다운로드되었습니다.`);
    } catch (err) {
      toast('error', '리포트 생성 실패', err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setExporting(false);
    }
  }, [state, toast, addNotification, isPro, openUpgradeModal]);

  return { exportReport, exporting, isPro };
}
```

**변경 요약**:
- `exportReport(format)` — `'png' | 'pdf'` 인자 추가 (기본값 `'png'`)
- `usePlanGate()` 의존성 추가 → `isPro`, `openUpgradeModal`
- PDF 요청 시 Pro 체크 → Free면 업그레이드 모달
- `isPro`를 `exportReportAsPNG`/`exportReportAsPDF`에 전달 (워터마크 제어)
- `isPro` 반환 (Dashboard에서 버튼 분기용)

### 2.4 파일: `pages/Dashboard.tsx` (수정)

#### 2.4.1 내보내기 버튼 영역 변경

```typescript
// 기존 (lines 126-135)
<div className="flex justify-end">
  <button onClick={exportReport} disabled={exporting} className="...">
    <Download size={16} />
    {exporting ? '내보내는 중...' : '리포트 내보내기'}
  </button>
</div>

// 변경 후
<div className="flex justify-end gap-2">
  <button
    onClick={() => exportReport('png')}
    disabled={exporting}
    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
  >
    <Download size={16} />
    {exporting ? '내보내는 중...' : 'PNG 내보내기'}
  </button>
  <button
    onClick={() => exportReport('pdf')}
    disabled={exporting}
    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded-lg transition-all disabled:opacity-50"
  >
    <Download size={16} />
    PDF 내보내기
    {!isPro && <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full ml-1">Pro</span>}
  </button>
</div>
```

- `const { exportReport, exporting, isPro } = useExportReport();`로 변경
- PNG 버튼: 기존과 동일 (Free/Pro 공용)
- PDF 버튼: 항상 표시, Free 유저에게 "Pro" 배지 표시
- 클릭 시 `useExportReport` 내에서 Pro 게이팅 처리

---

## 3. CF-2: 저장된 분석 불러오기

> 실행 순서 3번 — CF-1 완료 후

### 3.1 파일: `lib/supabaseData.ts` (수정)

#### 3.1.1 `deleteSnapshot` 함수 추가

```typescript
export async function deleteSnapshot(snapshotId: string): Promise<void> {
  const client = getSupabase();
  const { error } = await client
    .from('fre_analysis_snapshots')
    .delete()
    .eq('id', snapshotId);

  if (error) throw new Error(error.message);
}
```

#### 3.1.2 `listAllSnapshots` 함수 추가

현재 `listSnapshots(datasetId)`는 특정 dataset에 종속. 사용자의 전체 스냅샷을 가져오려면 user 기반 조회 필요.

```typescript
export async function listAllSnapshots(): Promise<(FRESnapshot & { dataset_name?: string })[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_analysis_snapshots')
    .select('*, fre_datasets!inner(file_name)')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return (data || []).map(row => ({
    ...row,
    dataset_name: row.fre_datasets?.file_name || undefined,
    fre_datasets: undefined,
  }));
}
```

**핵심**: RLS가 `auth.uid() = user_id`로 설정되어 있으므로 별도 user_id 필터 불필요. `fre_datasets`와 inner join으로 파일명도 가져옴.

### 3.2 파일: `hooks/useSavedAnalyses.ts` (신규)

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { FRESnapshot } from '../lib/supabaseData';
import { useAuth } from '../context/AuthContext';

export function useSavedAnalyses() {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<(FRESnapshot & { dataset_name?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshots = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { listAllSnapshots } = await import('../lib/supabaseData');
      const data = await listAllSnapshots();
      setSnapshots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const removeSnapshot = useCallback(async (id: string) => {
    try {
      const { deleteSnapshot } = await import('../lib/supabaseData');
      await deleteSnapshot(id);
      setSnapshots(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    }
  }, []);

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  return { snapshots, loading, error, reload: loadSnapshots, removeSnapshot };
}
```

**특성**:
- 로그인 유저에게만 로드 (`!user` 시 skip)
- `listAllSnapshots` dynamic import (번들 분리)
- `removeSnapshot` — 서버 삭제 + 로컬 상태 즉시 반영 (낙관적 업데이트)

### 3.3 파일: `pages/Dashboard.tsx` (수정)

#### 3.3.1 저장된 분석 섹션 추가

Dashboard의 하단 grid (`grid-cols-1 lg:grid-cols-2`) 아래에 추가:

```typescript
import { useSavedAnalyses } from '../hooks/useSavedAnalyses';
import { Clock, Trash2 } from '../components/Icons';

// 컴포넌트 내부
const { snapshots, loading: snapshotsLoading, removeSnapshot } = useSavedAnalyses();
```

UI 구조:

```tsx
{/* Saved Analyses — 로그인 유저 + 스냅샷 있을 때만 표시 */}
{snapshots.length > 0 && (
  <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-bold text-white flex items-center gap-2">
        <Clock size={16} className="text-accent" />
        저장된 분석
      </h3>
      <span className="text-xs text-slate-500">{snapshots.length}개</span>
    </div>
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {snapshots.map(snap => (
        <div
          key={snap.id}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
          onClick={() => restoreSnapshot(snap)}
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm text-white font-medium truncate">
              {snap.snapshot_type} — {snap.dataset_name || '알 수 없는 데이터'}
            </div>
            <div className="text-xs text-slate-500">
              {new Date(snap.created_at).toLocaleString('ko-KR')}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); removeSnapshot(snap.id); }}
            className="p-1.5 rounded text-slate-500 hover:text-coral hover:bg-coral/10 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  </div>
)}
```

#### 3.3.2 `restoreSnapshot` 함수

스냅샷의 `results` 데이터를 AppContext에 dispatch:

```typescript
const { dispatch } = useAppContext();

const restoreSnapshot = useCallback((snap: FRESnapshot) => {
  const results = snap.results as Record<string, unknown>;
  if (!results) return;

  // results에 저장된 분석 결과를 AppContext에 복원
  if (results.funnelResults) {
    dispatch({ type: 'SET_FUNNEL_RESULTS', payload: results.funnelResults as AppState['funnelResults'] });
  }
  if (results.retentionResults) {
    dispatch({ type: 'SET_RETENTION_RESULTS', payload: results.retentionResults as AppState['retentionResults'] });
  }
  if (results.insights) {
    dispatch({ type: 'SET_INSIGHTS', payload: results.insights as AppState['insights'] });
  }

  toast('success', '분석 복원 완료', `${snap.snapshot_type} 분석이 복원되었습니다.`);
}, [dispatch, toast]);
```

**주의**: `dispatch` action 타입은 기존 `reducer.ts`에 이미 존재하는 `SET_FUNNEL_RESULTS`, `SET_RETENTION_RESULTS`, `SET_INSIGHTS` 사용. 없는 action이 있다면 추가 필요 → Do 단계에서 확인.

---

## 4. CF-3: 공유 가능한 리포트 URL (Pro 전용)

> 실행 순서 4번 — Supabase Migration 필요

### 4.1 Supabase Migration

```sql
-- CF-3: 공유 기능용 컬럼 추가
ALTER TABLE fre_analysis_snapshots
  ADD COLUMN share_token TEXT UNIQUE,
  ADD COLUMN is_shared BOOLEAN DEFAULT false;

-- 공유된 스냅샷에 대한 공개 읽기 정책
CREATE POLICY "shared_snapshot_public_read" ON fre_analysis_snapshots
  FOR SELECT USING (is_shared = true);

-- share_token 인덱스 (조회 성능)
CREATE INDEX idx_snapshots_share_token ON fre_analysis_snapshots(share_token)
  WHERE share_token IS NOT NULL;
```

### 4.2 파일: `lib/supabaseData.ts` (수정)

#### 4.2.1 FRESnapshot 인터페이스 확장

```typescript
export interface FRESnapshot {
  id: string;
  dataset_id: string;
  snapshot_type: string;
  config: Record<string, unknown> | null;
  results: Record<string, unknown> | null;
  created_at: string;
  // CF-3 추가
  share_token?: string | null;
  is_shared?: boolean;
}
```

#### 4.2.2 `shareSnapshot` 함수 추가

```typescript
export async function shareSnapshot(snapshotId: string): Promise<string> {
  const client = getSupabase();
  const shareToken = crypto.randomUUID();

  const { error } = await client
    .from('fre_analysis_snapshots')
    .update({ share_token: shareToken, is_shared: true })
    .eq('id', snapshotId);

  if (error) throw new Error(error.message);
  return shareToken;
}
```

#### 4.2.3 `getSharedSnapshot` 함수 추가

```typescript
export async function getSharedSnapshot(shareToken: string): Promise<FRESnapshot | null> {
  const client = getSupabase();
  const { data, error } = await client
    .from('fre_analysis_snapshots')
    .select('*')
    .eq('share_token', shareToken)
    .eq('is_shared', true)
    .single();

  if (error) return null;
  return data;
}
```

**보안**: `is_shared = true` 체크 + RLS `shared_snapshot_public_read` 정책이 이중 보호. 비공유 스냅샷은 token이 있어도 조회 불가.

### 4.3 파일: `components/ShareButton.tsx` (신규)

```typescript
import React, { useState } from 'react';
import { Share2, Check, Copy, Loader2 } from './Icons';
import { usePlanGate } from '../hooks/usePlanGate';
import { useToast } from './Toast';

type ShareButtonProps = {
  snapshotId: string;
  existingToken?: string | null;
};

export const ShareButton: React.FC<ShareButtonProps> = ({ snapshotId, existingToken }) => {
  const { isPro, openUpgradeModal } = usePlanGate();
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(
    existingToken ? `${window.location.origin}/shared/${existingToken}` : null
  );
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!isPro) {
      openUpgradeModal('공유 리포트 URL은 Pro 요금제에서 사용할 수 있습니다.');
      return;
    }

    if (shareUrl) {
      // 이미 공유됨 → 복사
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast('success', '링크 복사됨');
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    setSharing(true);
    try {
      const { shareSnapshot } = await import('../lib/supabaseData');
      const token = await shareSnapshot(snapshotId);
      const url = `${window.location.origin}/shared/${token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast('success', '공유 링크 생성됨', '클립보드에 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast('error', '공유 실패', err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
    >
      {sharing ? <Loader2 size={14} className="animate-spin" /> : copied ? <Check size={14} className="text-accent" /> : shareUrl ? <Copy size={14} /> : <Share2 size={14} />}
      {sharing ? '생성 중...' : copied ? '복사됨' : shareUrl ? '링크 복사' : '공유'}
      {!isPro && <span className="text-xs bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded-full">Pro</span>}
    </button>
  );
};
```

**상태 흐름**:
1. 미공유: `Share2` 아이콘 + "공유" → 클릭 시 token 생성 + URL 복사
2. 공유 완료: `Copy` 아이콘 + "링크 복사" → 클릭 시 클립보드 복사
3. 복사 직후: `Check` 아이콘 + "복사됨" → 2초 후 리셋

### 4.4 파일: `pages/SharedReport.tsx` (신규)

```typescript
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageLoader } from '../components/PageLoader';

export const SharedReport: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [snapshot, setSnapshot] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const { getSharedSnapshot } = await import('../lib/supabaseData');
        const data = await getSharedSnapshot(token);
        if (!data) {
          setError('공유된 리포트를 찾을 수 없습니다.');
        } else {
          setSnapshot(data.results);
        }
      } catch {
        setError('리포트를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) return <PageLoader />;

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">리포트를 찾을 수 없습니다</h1>
          <p className="text-slate-400">{error || '잘못된 링크이거나 공유가 해제되었습니다.'}</p>
        </div>
      </div>
    );
  }

  // 읽기 전용 리포트 렌더링
  // snapshot 내 funnelResults, retentionResults, insights 등을 표시
  const results = snapshot as Record<string, unknown>;
  const funnelResults = results.funnelResults as { step: string; users: number; conversionRate: number }[] | undefined;
  const retentionResults = results.retentionResults as { cohort: string; users: number; days: Record<string, number> }[] | undefined;
  const insights = results.insights as { type: string; title: string; body: string }[] | undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* 상단 바 */}
      <div className="border-b border-white/[0.06] bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-accent font-bold text-lg">FRE Analytics</span>
          <span className="text-xs text-slate-500">공유 리포트 (읽기 전용)</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* 퍼널 결과 */}
        {funnelResults && funnelResults.length > 0 && (
          <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">퍼널 분석</h2>
            <div className="space-y-2">
              {funnelResults.map((step, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm text-slate-300 w-40 truncate">{step.step}</span>
                  <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                    <div
                      className="h-full bg-accent/60 rounded"
                      style={{ width: `${step.conversionRate}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-24 text-right">
                    {step.users.toLocaleString()} ({step.conversionRate.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 리텐션 */}
        {retentionResults && retentionResults.length > 0 && (
          <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">리텐션</h2>
            <p className="text-sm text-slate-400">{retentionResults.length}개 코호트 분석</p>
          </div>
        )}

        {/* 인사이트 */}
        {insights && insights.length > 0 && (
          <div className="bg-surface border border-white/[0.06] rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">인사이트</h2>
            <div className="space-y-3">
              {insights.map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/5">
                  <div className="text-sm font-medium text-white">{item.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{item.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 하단 CTA */}
      <div className="border-t border-white/[0.06] bg-surface mt-12">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center">
          <p className="text-slate-400 text-sm mb-3">나도 퍼널·리텐션 분석이 필요하다면?</p>
          <a
            href="/"
            className="inline-block px-6 py-2.5 text-sm font-semibold text-background bg-accent hover:bg-accent/90 rounded-lg transition-all"
          >
            FRE Analytics 시작하기
          </a>
        </div>
      </div>
    </div>
  );
};
```

**특성**:
- 인증 불필요 (public 라우트)
- RLS `shared_snapshot_public_read` 정책으로 접근 제어
- 읽기 전용 — 수정/삭제 UI 없음
- 하단 CTA로 서비스 유입 유도

### 4.5 파일: `router.tsx` (수정)

```typescript
// 추가 lazy import
const SharedReport = lazy(() => import('./pages/SharedReport').then(m => ({ default: m.SharedReport })));

// 라우트 배열에 추가 (/app 밖, public)
{
  path: '/shared/:token',
  element: <Suspense fallback={<PageLoader />}><SharedReport /></Suspense>,
},
```

**위치**: `/pricing` 라우트 아래에 추가.

### 4.6 파일: `components/Icons.tsx` (수정)

필요한 아이콘 추가 확인:
- `Share2` — 공유 버튼
- `Copy` — 링크 복사
- `Check` — 복사 완료
- `Clock` — 저장된 분석 섹션
- `Trash2` — 삭제 버튼
- `Loader2` — 로딩 스피너

기존 Icons.tsx에 없는 아이콘만 추가.

### 4.7 파일: Dashboard.tsx — ShareButton 통합

저장된 분석 목록의 각 항목에 `ShareButton` 추가:

```tsx
<ShareButton
  snapshotId={snap.id}
  existingToken={snap.share_token}
/>
```

---

## 5. 파일 변경 요약

| 파일 | 변경 | 태스크 | 설명 |
|------|------|--------|------|
| `lib/reportEngine.ts` | 수정 | CF-4, CF-1 | drawWatermark + exportReportAsPDF |
| `hooks/useExportReport.ts` | 수정 | CF-1, CF-4 | 포맷 선택 + isPro 전달 |
| `pages/Dashboard.tsx` | 수정 | CF-1, CF-2 | PNG/PDF 버튼 + 저장된 분석 UI |
| `hooks/useSavedAnalyses.ts` | 신규 | CF-2 | 저장된 분석 CRUD 훅 |
| `lib/supabaseData.ts` | 수정 | CF-2, CF-3 | deleteSnapshot + listAllSnapshots + shareSnapshot + getSharedSnapshot |
| `components/ShareButton.tsx` | 신규 | CF-3 | 공유 링크 생성 버튼 |
| `pages/SharedReport.tsx` | 신규 | CF-3 | 공유 리포트 읽기 전용 페이지 |
| `router.tsx` | 수정 | CF-3 | /shared/:token 라우트 |
| `components/Icons.tsx` | 수정 | CF-2, CF-3 | Share2, Copy, Clock, Trash2 아이콘 추가 |
| `package.json` | 수정 | CF-1 | jspdf 의존성 |

**총 10파일** (3 신규, 7 수정)

## 6. 실행 순서

```
CF-4 (워터마크)
  └─ reportEngine.ts: drawWatermark, isPro 매개변수

  ↓

CF-1 (PDF 내보내기)
  └─ package.json: jspdf 설치
  └─ reportEngine.ts: exportReportAsPDF
  └─ useExportReport.ts: 포맷 선택 + usePlanGate 통합
  └─ Dashboard.tsx: PNG/PDF 내보내기 버튼

  ↓

CF-2 (저장된 분석 불러오기)
  └─ supabaseData.ts: listAllSnapshots, deleteSnapshot
  └─ useSavedAnalyses.ts: 신규 훅
  └─ Dashboard.tsx: 저장된 분석 섹션
  └─ Icons.tsx: Clock, Trash2

  ↓

CF-3 (공유 리포트 URL)
  └─ Supabase Migration: share_token, is_shared, RLS
  └─ supabaseData.ts: shareSnapshot, getSharedSnapshot, FRESnapshot 확장
  └─ ShareButton.tsx: 신규 컴포넌트
  └─ SharedReport.tsx: 신규 페이지
  └─ router.tsx: /shared/:token 라우트
  └─ Icons.tsx: Share2, Copy
  └─ Dashboard.tsx: ShareButton 통합
```

## 7. 위험 요소 및 대응

| 위험 | 영향 | 대응 |
|------|------|------|
| jsPDF 번들 크기 (~290KB) | 초기 로드 영향 | dynamic import → 별도 chunk, PDF 클릭 시에만 로드 |
| Canvas toDataURL CORS | 외부 이미지 포함 시 실패 | 현재 Canvas는 텍스트만 사용 → CORS 이슈 없음 |
| iOS Safari PDF 다운로드 | pdf.save() 호환성 | jsPDF는 내부적으로 Blob URL 사용, iOS Safari 지원 |
| RLS 공유 정책 충돌 | 기존 owner-only 정책과 공개 읽기 | `is_shared = true` 조건으로 분리, 기존 정책 유지 |
| Supabase join 쿼리 성능 | listAllSnapshots N+1 | inner join + limit(20)으로 제한 |
