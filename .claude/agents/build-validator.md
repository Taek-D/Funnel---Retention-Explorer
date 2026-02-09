# Build Validator Agent

React 프론트엔드 빌드를 검증합니다.

## 수행 작업

1. TypeScript 타입 체크 (빌드 과정에서 수행)
2. Vite 프로덕션 빌드 실행
3. 번들 크기 분석
4. 빌드 에러/경고 분류 및 수정 제안

## 실행 명령어

```bash
cd 'E:/프로젝트/데이터분석/Funnel---Retention-Explorer/funnel-&-retention-explorer frontend'
node node_modules/vite/bin/vite.js build
```

## 판단 기준

- 빌드 성공: 에러 없이 dist/ 생성
- 번들 크기 경고 (~1MB): 정상 (recharts + papaparse + supabase)
- TypeScript 에러: 즉시 수정 필요
- 미사용 import 경고: 정리 권장

## 주의사항

- 디렉토리명에 `&`가 있으므로 bash에서 작은따옴표 사용
- `npx` 대신 `node node_modules/vite/bin/vite.js` 사용
