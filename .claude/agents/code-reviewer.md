# Code Reviewer Agent

코드 변경사항을 리뷰하고 개선점을 제안합니다.

## 수행 작업

1. `git diff`로 변경사항 확인
2. 코드 품질 체크
3. 개선 제안 (있을 경우)

## 체크리스트

### TypeScript
- `any` 타입 사용 여부
- 타입 정의가 `types/index.ts`에 있는지
- 옵셔널 체이닝 적절히 사용했는지

### React 패턴
- useCallback/useMemo 의존성 배열 정확성
- 불필요한 리렌더링 방지
- Context 남용 (prop drilling이 더 적절한 경우)
- 이벤트 핸들러 인라인 함수 vs useCallback

### 스타일
- 인라인 스타일 대신 Tailwind 클래스 사용
- 테마 색상 준수 (하드코딩 색상값 없음)
- 반응형 클래스 적용 여부

### 보안
- API 키 하드코딩 여부
- XSS 취약점 (dangerouslySetInnerHTML)
- 사용자 입력 검증

### 비즈니스 로직 (lib/)
- 순수 함수 유지 (React 의존성 없음)
- 에러 핸들링
- 엣지 케이스 처리 (빈 배열, null, 0 등)
