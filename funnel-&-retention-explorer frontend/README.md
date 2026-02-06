# Funnel & Retention Explorer - React Frontend

React 19 + TypeScript + Vite 6 기반의 퍼널/리텐션/세그먼트/구독 분석 대시보드입니다.

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 기술 스택

- **React 19** + **TypeScript 5.8** + **Vite 6.2**
- **Recharts 3.7** - 차트 시각화 (BarChart, AreaChart)
- **PapaParse 5.5** - CSV 파싱
- **Lucide React** - 아이콘
- **Tailwind CSS (CDN)** - 유틸리티 CSS, 다크 테마

## 아키텍처

```
lib/          순수 TypeScript 모듈 (React 의존성 없음)
  ├── csvParser.ts, dataProcessor.ts
  ├── funnelEngine.ts, retentionEngine.ts, segmentEngine.ts
  ├── insightsEngine.ts, subscriptionEngine.ts
  ├── formatters.ts, constants.ts, recentFiles.ts

context/      전역 상태 관리 (React Context + useReducer, 18개 액션)
  ├── AppContext.tsx, actions.ts, reducer.ts

hooks/        lib ↔ React 상태 브릿지
  ├── useCSVUpload.ts, useColumnMapping.ts
  ├── useFunnelAnalysis.ts, useRetentionAnalysis.ts
  ├── useSegmentComparison.ts, useInsights.ts

pages/        UI 컴포넌트 (hooks 소비)
  ├── Dashboard, DataImport, FunnelAnalysis, FunnelEditor
  ├── RetentionAnalysis, SegmentComparison, Insights, MobilePreview
```

## 배포

Netlify에 자동 배포됩니다 (`main` 브랜치 push 시).
