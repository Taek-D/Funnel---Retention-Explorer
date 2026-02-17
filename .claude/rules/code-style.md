# Code Style Rules

## Naming
- 함수명/변수명: 영어 camelCase
- 한국어 UI 텍스트 (사용자 대면 문자열)
- 커밋 메시지: 영어 conventional commits (feat, fix, refactor, docs)

## TypeScript
- `type` 선호 (`interface`는 types/index.ts에서만)
- `any` 타입 사용 금지
- `var`, `eval()`, `document.write()` 사용 금지

## Styling
- Tailwind CSS 클래스만 사용 (인라인 스타일 금지)
- 테마 토큰: bg-background, bg-surface, bg-elevated, text-accent, text-coral, text-amber
- 반응형: grid-cols-1 lg:grid-cols-12 패턴

## Icons & Components
- 새 아이콘: components/Icons.tsx에서 Lucide React re-export
- 새 상태: types/index.ts -> context/reducer.ts -> context/actions.ts 순서

## Imports
- `console.log` 커밋 금지 (디버깅 후 반드시 제거)
- 미사용 import 정리
