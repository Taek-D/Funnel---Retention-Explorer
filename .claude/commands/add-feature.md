$ARGUMENTS 기능을 React 프론트엔드에 추가합니다.

## 작업 순서

1. 요청된 기능을 분석하고 영향받는 영역 파악:
   - 데이터 처리/분석 → `lib/` (순수 TypeScript 모듈)
   - UI 컴포넌트 → `components/` (공유) 또는 `pages/` (페이지별)
   - 상태 관리 → `context/reducer.ts` + `context/actions.ts` + `types/index.ts`
   - 비즈니스 로직 → `hooks/` (커스텀 Hook)
   - 라우팅 → `router.tsx`
2. 기존 코드 패턴을 먼저 읽고 동일한 패턴으로 구현
3. 빌드 확인: `node node_modules/vite/bin/vite.js build`
4. 구현 완료 후 체크리스트 확인

## 필수 체크리스트

- [ ] TypeScript 타입 정의 (`types/index.ts`)
- [ ] 한국어 UI 텍스트 (사용자 대면 문자열)
- [ ] Tailwind CSS 클래스 사용 (인라인 스타일 금지)
- [ ] 테마 색상 준수 (bg-background, bg-surface, text-accent 등)
- [ ] 반응형 디자인 (모바일 360px ~ 데스크탑 1400px)
- [ ] 새 아이콘은 `components/Icons.tsx`에서 re-export
- [ ] 새 상태가 필요하면 types → reducer → actions 순서로 추가
- [ ] 빌드 에러 없음

## 새 페이지 추가 시

1. `pages/NewPage.tsx` 생성
2. `router.tsx`에 라우트 추가
3. `components/Sidebar.tsx`에 네비게이션 항목 추가

## 금지사항

- `any` 타입 사용 금지
- 기존 동작을 깨뜨리는 변경 금지
- `console.log` 남기기 금지
