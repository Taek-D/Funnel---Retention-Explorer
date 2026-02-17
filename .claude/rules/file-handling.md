# File Handling Rules

## 디렉토리 주의사항
- `funnel-&-retention-explorer frontend/` 디렉토리명에 `&` 포함
- bash에서 작은따옴표 필수: `cd 'funnel-&-retention-explorer frontend'`
- `npx` 대신 `node node_modules/vite/bin/vite.js` 사용 권장

## 빌드
- 개발 서버: `node node_modules/vite/bin/vite.js` (port 3000)
- 프로덕션 빌드: `node node_modules/vite/bin/vite.js build`
- 번들 크기 경고 (~1MB): 정상 (recharts + papaparse + supabase)

## 배포
- Vercel 자동 배포 (main 브랜치 push)
- Root Directory: `funnel-&-retention-explorer frontend`
