$ARGUMENTS 버그를 조사하고 수정합니다.

## 작업 순서

1. 버그 현상 파악 및 관련 코드 탐색
2. 원인 분석:
   - `lib/` 비즈니스 로직 오류 (데이터 처리, 분석 엔진)
   - `hooks/` 상태 관리 로직 (useCallback 의존성, 무한 렌더링)
   - `context/reducer.ts` 상태 업데이트 누락
   - `pages/` 또는 `components/` UI 렌더링 이슈
   - `router.tsx` 라우팅 문제
   - `types/index.ts` 타입 불일치
3. 최소한의 변경으로 수정 (관련 없는 코드 건드리지 않기)
4. 빌드 확인: `node node_modules/vite/bin/vite.js build`
5. 수정 내용 요약 제공

## 디버깅 체크포인트

- AppContext 상태가 올바르게 dispatch되는지
- useCallback/useMemo 의존성 배열이 정확한지
- null/undefined 방어 코드 (옵셔널 체이닝)
- CSV 파싱 후 컬럼 매핑 흐름 (`csvParser → dataProcessor → useCSVUpload`)
- Supabase 쿼리 에러 핸들링
- 비동기 처리 (async/await, Promise 체인)

## Provider 계층 관련 이슈

```
AuthProvider > AppProvider > ToastProvider > NotificationProvider > RouterProvider
```
- Context를 사용하는 컴포넌트가 해당 Provider 하위에 있는지 확인
- ProtectedRoute 밖에서 AppContext를 사용하면 에러 발생
