# Funnel & Retention Explorer

정적 프론트엔드 SPA로, CSV 기반 퍼널/리텐션/세그먼트/구독 분석 대시보드입니다.

## 기술 스택

- **언어**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **차트**: Chart.js (CDN)
- **PDF**: jsPDF + html2canvas (CDN)
- **한글 폰트**: NotoSansKR (pdf_font_noto_sans_kr.js)
- **배포**: Netlify (정적 호스팅, netlify.toml)
- **패키지 매니저**: 없음 (CDN 기반, npm/yarn 불필요)
- **빌드 도구**: 없음 (빌드 스텝 불필요)

## 프로젝트 구조

```
├── index.html              # 메인 HTML (한국어 UI, SPA)
├── app.js                  # 핵심 로직 (상태관리, 데이터 파싱, 분석 엔진)
├── charts.js               # Chart.js 차트 렌더링 (퍼널/리텐션/세그먼트)
├── styles.css              # 다크 테마 스타일시트 (CSS 변수 기반)
├── pdf_font_noto_sans_kr.js # PDF 한글 폰트 데이터 (7.9MB, 수정 금지)
├── netlify.toml            # Netlify 배포 설정
├── 샘플 데이터/             # 테스트용 CSV 샘플 데이터
└── *.md                    # 각종 가이드 문서
```

## 핵심 아키텍처

- **AppState** (app.js): 전역 상태 객체. rawData, processedData, columnMapping, funnelResults, retentionResults 등 모든 분석 상태를 관리
- **이벤트 패턴 자동 감지**: EVENT_PATTERNS 객체로 이커머스/구독 데이터 유형 자동 판별
- **탭 기반 SPA**: upload → funnel → retention → segment → insights 화면 전환
- **CSV 파싱**: PapaParse (CDN)로 CSV 파싱 후 컬럼 매핑

## 코딩 컨벤션

- 한국어 UI 텍스트 사용 (사용자 대면 문자열)
- 함수명/변수명은 영어 camelCase
- CSS 변수는 `--` 접두사 (예: `--accent-primary`, `--bg-card`)
- 다크 테마 기본 (`#0a0e27` 배경)
- Chart.js 인스턴스는 반드시 기존 인스턴스 destroy 후 재생성
- 반응형 디자인 (모바일/태블릿/데스크탑)
- DOM 요소 접근 시 getElementById 반환값 null 체크 권장
- 이벤트 리스너 중복 등록 방지 (초기화 함수에서만 등록)

## 개발 워크플로우

1. `index.html`을 브라우저에서 직접 열거나 Live Server로 실행
2. 코드 수정 후 브라우저 새로고침으로 확인
3. Netlify에 자동 배포 (main 브랜치 푸시 시)

## 주의사항

- `pdf_font_noto_sans_kr.js`는 7.9MB 바이너리 폰트 데이터이므로 읽거나 수정하지 말 것
- 외부 라이브러리는 모두 CDN으로 로드 (index.html의 script 태그 참조)
- 빌드 프로세스가 없으므로 파일 직접 수정이 곧 배포 코드
- 커밋 메시지는 영어로 작성 (conventional commits: feat, fix, refactor, docs 등)

## 금지 사항

- npm/yarn/pnpm 등 패키지 매니저 도입 금지 (CDN 기반 유지)
- 빌드 도구(webpack, vite 등) 도입 금지
- `pdf_font_noto_sans_kr.js` 파일 읽기/수정 금지
- 기존 CSS 변수 체계를 무시하고 하드코딩된 색상값 사용 금지
- `var`, `eval()`, `document.write()` 사용 금지
- 인라인 스타일 사용 금지 (styles.css의 CSS 변수/클래스 활용)
