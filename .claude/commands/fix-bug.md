$ARGUMENTS 버그를 조사하고 수정합니다.

## 작업 순서

1. 버그 현상 파악 및 관련 코드 탐색
2. 원인 분석:
   - app.js의 AppState 상태 흐름 추적
   - charts.js의 Chart.js 인스턴스 라이프사이클 확인
   - index.html의 DOM 요소 ID 및 이벤트 바인딩 확인
   - styles.css의 레이아웃/반응형 이슈 확인
3. 최소한의 변경으로 수정 (관련 없는 코드 건드리지 않기)
4. 수정 내용 요약 제공

## 디버깅 체크포인트

- AppState 값이 올바르게 설정/업데이트되는지
- DOM 요소가 존재하는지 (getElementById 반환값)
- Chart.js 인스턴스가 destroy 없이 재생성되고 있지 않은지
- CSV 파싱 후 컬럼 매핑이 올바른지
- 이벤트 리스너 중복 등록 여부
