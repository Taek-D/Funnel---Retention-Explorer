Vercel 배포 상태를 확인합니다.

## 작업 순서

1. `mcp__vercel__list_deployments`로 최근 배포 3개 조회
2. 최신 배포의 상태 (READY/ERROR/BUILDING) 확인
3. 배포 URL과 커밋 SHA 매핑
4. 이상이 있으면 `mcp__vercel__get_deployment_build_logs`로 원인 분석

## 출력 형식

```
최근 배포:
1. [READY] abc1234 - feat: ... (2분 전)
2. [READY] def5678 - fix: ... (1시간 전)
3. [READY] ghi9012 - refactor: ... (3시간 전)

현재 상태: 정상 ✅
URL: https://fre-analytics-castletaek9643-9522s-projects.vercel.app
```
