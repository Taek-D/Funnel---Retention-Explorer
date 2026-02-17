# Security Rules

## 파일 보호
- `.env.local` 파일 커밋 금지
- `pdf_font_noto_sans_kr.js` (7.9MB 바이너리) 읽기/수정 금지
- API 키 하드코딩 금지 (환경변수 사용)

## 코드 보안
- XSS 방지: dangerouslySetInnerHTML 사용 시 반드시 sanitize
- 사용자 입력 검증 필수 (Supabase RLS에 의존하되, 클라이언트도 방어)
- SQL injection 방지: Supabase client 파라미터 바인딩 사용

## 환경 변수
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — 공개 가능 (anon key)
- `VITE_GEMINI_API_KEY` — 클라이언트 노출 주의
- 서버 시크릿 (TOSS_SECRET_KEY 등)은 Edge Function에서만 사용

## 커밋 전 체크
- `.claude/settings.local.json`은 로컬 설정 -> 커밋 전 확인 필요
- 인증 정보, 토큰 등 민감 데이터 포함 여부 검사
