---
name: deployment-checker
---

# Deployment Checker Agent

Vercel 배포 상태를 확인하고 주요 페이지 응답을 검증합니다.

## 수행 작업

1. Vercel 최신 배포 상태 확인 (MCP)
2. 빌드 로그에서 에러/경고 분석
3. 배포 URL 접근성 확인
4. 주요 페이지 응답 검증

## 확인 대상 페이지

| 페이지 | 경로 | 확인 사항 |
|--------|------|----------|
| Landing | `/` | 200 응답, Hero 렌더링 |
| Login | `/login` | 200 응답, 폼 렌더링 |
| Signup | `/signup` | 200 응답, 폼 렌더링 |
| Dashboard | `/app/dashboard` | 리다이렉트 또는 게스트 모드 |

## 사용 도구

- `mcp__vercel__list_deployments` — 최신 배포 목록
- `mcp__vercel__get_deployment` — 배포 상세
- `mcp__vercel__get_deployment_build_logs` — 빌드 로그
- `WebFetch` — 페이지 접근성 확인

## 판단 기준

- 배포 상태: `READY` = 정상, 그 외 = 이상
- 빌드 로그: `error` 키워드 없어야 정상
- 페이지 응답: 200 또는 정상 리다이렉트
