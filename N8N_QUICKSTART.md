# n8n 워크플로우 빠른 시작 가이드

## 🚀 원클릭 Import 방법

### 1단계: 워크플로우 파일 다운로드
- 프로젝트 폴더에 `n8n-workflow-template.json` 파일이 있습니다

### 2단계: n8n에 Import
1. n8n 대시보드 접속
2. 왼쪽 메뉴에서 **"Workflows"** 클릭
3. 오른쪽 상단 **"⋮"** (더보기) → **"Import from File"** 선택
4. `n8n-workflow-template.json` 파일 선택
5. **"Import"** 클릭

### 3단계: SMTP 설정
1. **"Send Email"** 노드 클릭
2. **Credentials** 섹션에서 **"Create New"** 클릭
3. SMTP 정보 입력:

#### Gmail 사용 시:
- **User**: your-email@gmail.com
- **Password**: [Google 앱 비밀번호](https://myaccount.google.com/apppasswords)
- **Host**: smtp.gmail.com
- **Port**: 465
- **SSL/TLS**: 활성화

#### 기타 SMTP:
- 이메일 제공업체의 SMTP 설정 참고

4. **"Send Email"** 노드에서 **"From Email"** 수정:
   - `noreply@yourcompany.com` → 실제 발신 이메일 주소

### 4단계: 워크플로우 활성화
1. 오른쪽 상단 **"Inactive"** 스위치 클릭 → **"Active"**로 변경
2. **"Webhook"** 노드 클릭
3. **"Production URL"** 복사 (예: `https://your-n8n.app.n8n.cloud/webhook/analytics-report`)

### 5단계: 애플리케이션 설정
1. Funnel & Retention Explorer 열기
2. **인사이트 카드** 탭 → **⚙️ 이메일 설정** 클릭
3. **n8n Webhook URL**에 복사한 URL 붙여넣기
4. **수신 이메일 주소** 입력
5. **💾 설정 저장** → **🔍 연결 테스트**

## ✅ 테스트
1. CSV 데이터 업로드 및 분석
2. **📧 이메일로 발송** 클릭
3. 이메일 수신 확인!

---

## 📋 워크플로우 구성 요소

### 노드 구조
```
Webhook → Parse Report Data → Convert to Binary → Send Email
```

### 각 노드 설명

#### 1. **Webhook** 노드
- 애플리케이션으로부터 POST 요청 수신
- 경로: `/analytics-report`
- 즉시 응답 (200 OK)

#### 2. **Parse Report Data** 노드 (Function)
- 테스트 요청 처리
- 리포트 데이터 파싱
- HTML 이메일 본문 생성
- 인사이트 포맷팅

#### 3. **Convert to Binary** 노드 (Function)
- base64 PNG를 binary로 변환
- 각 첨부파일 처리
- Email 노드가 인식할 수 있는 형식으로 변환

#### 4. **Send Email** 노드
- SMTP를 통해 이메일 발송
- HTML 본문 + PNG 첨부파일
- 멀티 수신자 지원

---

## 🎨 커스터마이징

### 이메일 본문 수정
**Parse Report Data** 노드의 `emailBody` HTML을 수정하여:
- 회사 로고 추가
- 브랜드 컬러 변경
- 추가 섹션 삽입
- 레이아웃 조정

### 발신자 이름 변경
**Send Email** 노드에서:
- **From Email**: `reports@yourcompany.com`
- **From Name** (Options): `Analytics Team`

### 알림 추가
**Send Email** 노드 뒤에 추가 노드 연결:
- **Slack** 노드: 팀 채널에 발송 알림
- **Discord** 노드: Discord 서버 알림
- **HTTP Request**: 다른 시스템에 webhook 전송

---

## 🔧 고급 설정

### 조건부 발송
**IF** 노드를 **Parse Report Data** 뒤에 추가:
```javascript
// 특정 조건일 때만 이메일 발송
// 예: 인사이트가 5개 이상일 때
return $json.insights && $json.insights.length >= 5;
```

### 데이터 저장
**Google Sheets** 노드 추가:
- 발송 히스토리 기록
- 리포트 데이터 아카이브

### 스케줄링
**Schedule Trigger** 노드 추가:
- 정기적으로 리포트 요청
- **HTTP Request** 노드로 데이터 API 호출

---

## ❓ 트러블슈팅

### Import 실패
**문제**: "Invalid workflow JSON"  
**해결**: 
- JSON 파일이 손상되지 않았는지 확인
- 최신 n8n 버전 사용 (v1.0+)

### 이메일 발송 실패
**문제**: "Authentication failed"  
**해결**: 
- Gmail: [앱 비밀번호](https://myaccount.google.com/apppasswords) 사용
- 2단계 인증 활성화 필요
- SMTP 설정 재확인

### 첨부파일이 없음
**문제**: 이메일은 오는데 PNG가 없음  
**해결**: 
- **워크플로우 업데이트됨**: 최신 `n8n-workflow-template.json` 파일 재import 필요
  1. n8n에서 기존 워크플로우 삭제 (또는 비활성화)
  2. 최신 `n8n-workflow-template.json` 재import
  3. SMTP 설정 재입력
  4. 워크플로우 활성화
- **Convert to Binary** 노드가 올바르게 연결되었는지 확인
- n8n 실행 로그에서 에러 확인
- base64 데이터가 올바른지 확인

### Webhook 응답 없음
**문제**: 연결 테스트 실패  
**해결**: 
- 워크플로우가 **Active** 상태인지 확인
- Webhook URL이 올바른지 확인 (복사 오류)
- n8n 서버가 실행 중인지 확인

---

## 📦 백업

워크플로우를 수정한 후 백업:
1. n8n에서 워크플로우 열기
2. **"⋮"** → **"Export"** → **"Download"**
3. JSON 파일 안전한 곳에 보관

---

## 🔗 참고 자료

- [n8n 공식 문서](https://docs.n8n.io/)
- [Webhook 노드 가이드](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Email 노드 가이드](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.emailsend/)
- [Function 노드 가이드](https://docs.n8n.io/code/builtin/function/)

---

**원클릭으로 시작하세요! 🚀**
