# n8n 이메일 발송 워크플로우 설정 가이드

## 개요
이 가이드는 Funnel & Retention Explorer에서 생성된 PNG 리포트를 자동으로 이메일로 발송하기 위한 n8n 워크플로우 설정 방법을 설명합니다.

## 필요사항
- n8n 인스턴스 (클라우드 또는 자체 호스팅)
- SMTP 이메일 계정 (Gmail, SendGrid, Mailgun 등)

## n8n 워크플로우 구성

### 1단계: 새 워크플로우 생성

1. n8n 대시보드에서 **"New Workflow"** 클릭
2. 워크플로우 이름: `Analytics Report Email Sender`

### 2단계: Webhook 노드 추가

1. **Webhook** 노드 추가
2. 설정:
   - **Authentication**: None (또는 필요에 따라 Header Auth 사용)
   - **HTTP Method**: POST
   - **Path**: `analytics-report` (또는 원하는 경로)
   - **Respond**: Immediately
   - **Response Code**: 200

3. **Save** 후 **Production URL** 복사
   - 예: `https://your-n8n.app.n8n.cloud/webhook/analytics-report`

### 3단계: 데이터 파싱 노드 추가 (선택사항)

**Function** 노드를 추가하여 받은 데이터를 처리합니다:

```javascript
// 받은 데이터 구조:
// {
//   "emailTo": ["user@example.com"],
//   "subject": "데이터 분석 리포트 - 2026-01-30 00:47",
//   "reportData": { ... },
//   "attachments": [
//     {
//       "filename": "analysis_report_20260130_0047_page_1.png",
//       "content": "base64EncodedString",
//       "mimeType": "image/png"
//     }
//   ],
//   "pageCount": 2
// }

const body = $input.item.json;

// 테스트 요청 무시
if (body.test === true) {
  return {
    json: {
      success: true,
      message: '테스트 성공'
    }
  };
}

// 이메일 본문 생성
const reportData = body.reportData || {};
const dataQuality = reportData.dataQuality || {};

const emailBody = `
<h2>📊 데이터 분석 리포트</h2>
<p>생성 시간: ${reportData.generatedAt || 'N/A'}</p>

<h3>데이터 요약</h3>
<ul>
  <li>총 행수: ${dataQuality.totalRows || 'N/A'}</li>
  <li>유효 행수: ${dataQuality.validRows || 'N/A'}</li>
  <li>고유 사용자: ${dataQuality.uniqueUsers || 'N/A'}</li>
  <li>분석 기간: ${dataQuality.dateMin || 'N/A'} ~ ${dataQuality.dateMax || 'N/A'}</li>
</ul>

<h3>주요 인사이트</h3>
<ul>
${(reportData.insights || []).slice(0, 5).map(insight => 
  `<li><strong>${insight.title || 'Insight'}</strong><br>${insight.body || ''}</li>`
).join('\n')}
</ul>

<p><em>상세한 분석 결과는 첨부된 이미지 파일(${body.pageCount || 0}장)을 확인해주세요.</em></p>
`;

return {
  json: {
    to: body.emailTo,
    subject: body.subject,
    htmlBody: emailBody,
    attachments: body.attachments
  }
};
```

### 4단계: Email (Send) 노드 추가

1. **Email** 노드 추가
2. 설정:
   - **Resource**: Message
   - **Operation**: Send
   - **From Email**: 발신자 이메일 주소
   - **To Email**: `{{ $json.to }}` (Function 노드에서 전달받음)
   - **Subject**: `{{ $json.subject }}`
   - **Email Type**: HTML
   - **Message**: `{{ $json.htmlBody }}`

3. **Attachments** 섹션:
   - **Add Attachment** > **Attachment Field Name Mode** 선택
   - 아래 **Code** 탭에서 표현식 입력:

```javascript
{{
  $json.attachments.map(att => ({
    "propertyName": att.filename,
    "binaryPropertyName": att.filename
  }))
}}
```

4. **Credentials** 설정:
   - **SMTP 설정** (Gmail 예시)
     - Host: `smtp.gmail.com`
     - Port: `465`
     - SSL/TLS: 활성화
     - User: 발신 이메일
     - Password: 앱 비밀번호 ([Gmail 앱 비밀번호 생성](https://support.google.com/accounts/answer/185833))

### 5단계: Binary 데이터 변환 노드 추가

**Function** 노드를 Email 노드 **앞에** 추가하여 base64를 binary로 변환:

```javascript
const attachments = $json.attachments || [];

// base64 → binary 변환
for (const att of attachments) {
  const binaryData = Buffer.from(att.content, 'base64');
  
  $binary[att.filename] = {
    data: binaryData.toString('base64'),
    mimeType: att.mimeType || 'image/png',
    fileName: att.filename,
    fileExtension: 'png'
  };
}

return {
  json: $json,
  binary: $binary
};
```

### 워크플로우 연결 순서

```
Webhook → Function (데이터 파싱) → Function (Binary 변환) → Email
```

## 애플리케이션 설정

### 1. n8n Webhook URL 복사
- n8n 워크플로우의 Webhook 노드에서 **Production URL** 복사

### 2. 애플리케이션에서 설정
1. Funnel & Retention Explorer 열기
2. **인사이트 카드** 탭으로 이동
3. **⚙️ 이메일 설정** 버튼 클릭
4. 설정 입력:
   - **n8n Webhook URL**: 복사한 webhook URL
   - **수신 이메일 주소**: 리포트를 받을 이메일 (쉼표로 여러 주소 입력 가능)
   - **분석 완료 시 자동으로 이메일 발송**: 원하면 체크
5. **💾 설정 저장** 클릭
6. **🔍 연결 테스트** 클릭하여 webhook 연결 확인

## 사용 방법

### 수동 발송
1. 데이터 업로드 및 분석 완료
2. **인사이트 카드** 탭으로 이동
3. **📧 이메일로 발송** 버튼 클릭
4. n8n이 이메일 발송

### 자동 발송
- 설정에서 "분석 완료 시 자동으로 이메일 발송" 체크
- 데이터 처리 완료 시 자동으로 이메일 발송됨

## CORS 이슈 해결

n8n 클라우드를 사용하는 경우 일반적으로 CORS 문제가 없지만, 자체 호스팅 시 다음 설정이 필요할 수 있습니다:

### n8n 환경 변수 설정
```bash
N8N_WEBHOOK_CORS_ALLOW_ORIGINS=*
# 또는 특정 도메인만
N8N_WEBHOOK_CORS_ALLOW_ORIGINS=https://yourdomain.com
```

## 전송 데이터 구조

### 요청 데이터 (애플리케이션 → n8n)
```json
{
  "emailTo": ["user@example.com", "user2@example.com"],
  "subject": "데이터 분석 리포트 - 2026-01-30 00:47",
  "reportData": {
    "generatedAt": "2026. 1. 30. 오전 12:47:18",
    "dataQuality": {
      "totalRows": 1000,
      "validRows": 980,
      "uniqueUsers": 250,
      "dateMin": "2023-01-01",
      "dateMax": "2023-12-31"
    },
    "funnel": [
      {
        "step": "view_item",
        "users": 250,
        "conversionRate": 100
      }
    ],
    "retention": {
      "matrix": [...]
    },
    "segment": [...],
    "insights": [
      {
        "title": "최대 이탈 지점 감지",
        "body": "상세 분석 내용...",
        "metric": "82.5% → 45.2%"
      }
    ]
  },
  "attachments": [
    {
      "filename": "analysis_report_20260130_0047_page_1.png",
      "content": "iVBORw0KGgoAAAANSUhEUgAA...[base64 string]",
      "mimeType": "image/png"
    },
    {
      "filename": "analysis_report_20260130_0047_page_2.png",
      "content": "iVBORw0KGgoAAAANSUhEUgAA...[base64 string]",
      "mimeType": "image/png"
    }
  ],
  "pageCount": 2
}
```

## 트러블슈팅

### 문제: Webhook 연결 실패
**해결책**:
- n8n 워크플로우가 **활성화(Activated)** 되어 있는지 확인
- Webhook URL이 정확한지 확인 (복사/붙여넣기 오류 확인)
- 네트워크 방화벽 설정 확인

### 문제: 이메일이 발송되지 않음
**해결책**:
- n8n Email 노드의 SMTP 설정 확인
- Gmail 사용 시: [앱 비밀번호](https://support.google.com/accounts/answer/185833) 사용
- n8n 워크플로우 실행 로그 확인

### 문제: 첨부 파일이 깨짐
**해결책**:
- Binary 변환 Function 노드가 올바르게 설정되었는지 확인
- base64 인코딩이 손상되지 않았는지 확인

### 문제: CORS 에러
**해결책**:
- n8n 환경 변수에 `N8N_WEBHOOK_CORS_ALLOW_ORIGINS` 설정
- 브라우저 개발자 도구 콘솔에서 정확한 에러 메시지 확인

## 추가 개선 사항

### 이메일 템플릿 커스터마이징
Function 노드에서 `emailBody` HTML을 수정하여 브랜딩, 로고, 스타일 추가 가능

### 알림 추가
- Slack 노드 추가하여 리포트 발송 알림
- Discord/Teams 등 다른 채널 연동

### 스케줄링
- n8n의 Schedule Trigger 노드를 추가하여 정기적으로 리포트 요청
- Webhook 대신 HTTP Request 노드로 데이터 가져오기

## 보안 권장사항

1. **Webhook 인증**: n8n Webhook 노드에서 Header Auth 사용
2. **HTTPS 사용**: 프로덕션에서는 반드시 HTTPS webhook 사용
3. **이메일 주소 검증**: 신뢰할 수 있는 도메인만 허용
4. **비밀번호 관리**: n8n credentials를 안전하게 보관

---

**참고 자료**:
- [n8n 공식 문서](https://docs.n8n.io/)
- [n8n Webhook 노드](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n Email 노드](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.emailsend/)
