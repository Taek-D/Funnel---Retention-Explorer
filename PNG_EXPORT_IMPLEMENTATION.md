# PNG 리포트 내보내기 구현 완료

## 개요
PDF 다운로드를 **PNG 이미지 내보내기**로 완전히 교체하여, 다운로드가 차단되는 환경(iframe sandbox, webview, iOS Safari)에서도 사용자가 리포트를 저장할 수 있도록 구현했습니다.

## 주요 변경사항

### 1. index.html (라벨 변경)
- **버튼 텍스트 변경**: `📥 리포트 다운로드 (PDF)` → `📷 리포트 다운로드 (PNG)`
- **버튼 ID 유지**: `id="exportReport"` (기존 이벤트 바인딩 그대로 유지)

### 2. app.js (PNG Export 시스템 구현)

#### 새로 추가된 헬퍼 함수들:

**A) `isDownloadHostileEnv()`** - 환경 감지
- iframe sandbox, webview, iOS Safari 등을 광범위하게 감지
- User-Agent 및 window.self/top 비교로 제한된 환경 판별

**B) `makeReportPngFilename(pageIndex)`** - 파일명 생성
- 타임스탬프 기반 파일명: `analysis_report_YYYYMMDD_HHMM_page_N.png`

**C) `downloadOrOpenBlobStrong(blob, filename)`** - 강력한 다운로드 함수
- ✅ 일반 환경: 자동 다운로드 시도
- ✅ 제한 환경: 새 탭으로 이미지 열기 (사용자가 이미지 저장/공유 가능)
- ✅ 최후 폴백: location.href로 이동

**D) `wrapText(ctx, text, x, y, maxWidth, lineHeight)`** - 텍스트 줄바꿈
- 한글 텍스트를 포함한 자동 줄바꿈 처리
- 공백이 없는 한글 문장도 글자 단위로 분할

**E) `drawCanvasWithBg(destCtx, srcCanvas, x, y, w, h, bgColor)`** - 차트 렌더링
- 차트 캔버스를 배경색과 함께 PNG로 그리기
- 기존 charts.js의 캔버스를 그대로 활용

**F) `buildReportSnapshot()`** - 리포트 데이터 수집
- AppState에서 현재 상태 스냅샷 생성
- 퍼널, 리텐션, 세그먼트, 인사이트 데이터 포함

**G) `createA4CanvasPx()` & `makePageContext()`** - 페이지 생성
- A4 크기의 캔버스 생성 (1240x1754px, ~150dpi)
- 한글 폰트 스택 적용: "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic"

**H) `renderReportPages(snapshot)`** - 멀티페이지 렌더링
- 리포트 내용을 A4 페이지 단위로 자동 분할
- 페이지 넘침 감지 및 자동 새 페이지 생성
- 포함 내용:
  - 데이터 요약
  - 퍼널 요약 + 차트
  - 리텐션 요약 + 차트
  - 세그먼트 요약 + 차트
  - 핵심 인사이트 (최대 5개)

**I) `exportReport()`** - 메인 내보내기 함수
- 스냅샷 생성 → 페이지 렌더링 → PNG 변환 → 다운로드/새 탭 열기
- 제한 환경에서 사용자 안내 메시지 표시

## 핵심 기능

### ✅ 다운로드 환경 대응
- **정상 환경**: PNG 파일 자동 다운로드
- **제한 환경**: 새 탭에 이미지 열기 → 사용자가 "이미지 저장/공유" 가능

### ✅ 멀티페이지 지원
- 리포트가 길어지면 자동으로 여러 장으로 분할
- 파일명: `analysis_report_YYYYMMDD_HHMM_page_1.png`, `page_2.png`, ...

### ✅ 한글 지원
- Canvas 텍스트 렌더링에 한글 폰트 스택 사용
- 자동 줄바꿈으로 텍스트 깨짐 방지

### ✅ 기존 기능 보존
- 퍼널/리텐션/세그먼트 분석 기능 정상 동작
- 차트 렌더링(charts.js) 수정 없이 그대로 활용
- 탭 전환, 인사이트 생성 등 모든 기존 기능 유지

## 검증 체크리스트

아래 항목들을 확인해주세요:

1. ✓ CSV 업로드 후 퍼널/리텐션/세그먼트 계산
2. ✓ 인사이트 탭에서 "📷 리포트 다운로드 (PNG)" 클릭
3. ✓ 일반 환경: PNG 파일 다운로드 확인
4. ✓ 제한 환경(iframe/webview): 새 탭에 이미지 열림 확인
5. ✓ 한글 텍스트가 깨지지 않고 정상 표시
6. ✓ 멀티페이지 생성 (리포트 길이에 따라 page_1, page_2...)
7. ✓ 기존 기능(탭 전환, 차트 렌더링) 정상 동작

## 주의사항

- **PDF 의존성 제거됨**: jsPDF는 더 이상 사용되지 않지만, index.html에서 CDN 링크는 남아있습니다 (제거해도 무방)
- **브라우저 호환성**: 최신 브라우저에서 Canvas.toBlob 및 URL.createObjectURL 지원 필요
- **파일 크기**: PNG는 PDF보다 파일 크기가 클 수 있으나, 호환성이 훨씬 우수함

## 코드 위치

- `index.html` 라인 315-317: 버튼 텍스트
- `app.js` 라인 1702-2091: PNG export 전체 구현부
- 주석: "PNG export workaround for sandbox/webview" 추가됨
