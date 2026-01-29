# 🌐 Netlify 배포 가이드

## 📦 Netlify Drop으로 1분 배포

### 1단계: Netlify Drop 열기

브라우저에서 접속:
```
https://app.netlify.com/drop
```

> 💡 **팁**: Netlify 계정이 없어도 배포 가능합니다!
> - 계정 없음: 배포 후 24시간 유지
> - 계정 있음: 영구 호스팅 (무료)

---

### 2단계: 폴더 준비

**배포할 파일 목록:**
- ✅ `index.html`
- ✅ `app.js`
- ✅ `charts.js`
- ✅ `styles.css`
- ✅ `pdf_font_noto_sans_kr.js`
- ✅ `sample_ecommerce_events_3000.csv`
- ✅ `sample_subscription_events_3000.csv`
- ✅ `netlify.toml` (선택)

**배포하지 않을 파일:**
- ❌ `.git/` 폴더
- ❌ `*.md` 파일 (문서)
- ❌ `n8n-workflow-template.json`

---

### 3단계: 드래그 앤 드롭

1. 윈도우 탐색기에서 프로젝트 폴더 열기:
   ```
   e:\데이터분석\Funnel---Retention-Explorer
   ```

2. 다음 파일들을 **선택**:
   - `index.html`
   - `app.js`
   - `charts.js`
   - `styles.css`
   - `pdf_font_noto_sans_kr.js`
   - `sample_ecommerce_events_3000.csv`
   - `sample_subscription_events_3000.csv`
   - `netlify.toml`

3. Netlify Drop 페이지로 드래그 앤 드롭!

4. 업로드 완료 대기 (약 10초)

---

### 4단계: 배포 완료 🎉

배포가 완료되면 다음과 같은 URL이 생성됩니다:
```
https://random-name-12345.netlify.app
```

**이제 이 URL로 전 세계 어디서든 접속 가능합니다!**

---

## 🔧 추가 설정 (선택사항)

### 커스텀 도메인 설정

1. Netlify에 로그인
2. **Domain settings** → **Add custom domain**
3. 도메인 연결

### 사이트 이름 변경

1. **Site settings** → **Site details**
2. **Change site name**
3. 원하는 이름 입력 (예: `funnel-retention-explorer`)
4. 새 URL: `https://funnel-retention-explorer.netlify.app`

### 자동 배포 설정 (GitHub 연동)

1. **Site settings** → **Build & deploy**
2. **Link repository**
3. GitHub 저장소 선택
4. 이후 Git push만 하면 자동 배포!

---

## 📊 배포 후 테스트

1. ✅ 사이트 접속 확인
2. ✅ CSV 샘플 데이터 업로드 테스트
3. ✅ 퍼널 분석 실행
4. ✅ 리텐션 분석 실행
5. ✅ PNG 리포트 다운로드 테스트
6. ✅ (선택) n8n 이메일 발송 테스트

---

## 🐛 문제 해결

### 페이지가 안 열려요
- **원인**: `index.html` 파일이 누락됨
- **해결**: 파일 목록 다시 확인 후 재배포

### 샘플 데이터가 안 보여요
- **원인**: CSV 파일 누락
- **해결**: CSV 파일 포함하여 재배포

### 폰트가 깨져요
- **원인**: `pdf_font_noto_sans_kr.js` 파일 누락
- **해결**: 폰트 파일 포함하여 재배포

### 차트가 안 보여요
- **원인**: `charts.js` 또는 `app.js` 파일 오류
- **해결**: 브라우저 콘솔(F12) 확인

---

## 💡 팁

### 빠른 업데이트
- 파일 수정 → 같은 방법으로 재배포
- Netlify가 자동으로 이전 버전 덮어씀

### 여러 버전 관리
- **Production**: `funnel-retention-explorer.netlify.app`
- **Staging**: `funnel-retention-test.netlify.app`

### 무료 플랜 제한
- ✅ 대역폭: 100GB/월
- ✅ 빌드 시간: 300분/월
- ✅ 사이트 수: 무제한
- **충분히 사용 가능합니다!**

---

## 📱 모바일 접속

배포된 URL은 모바일에서도 완벽하게 작동합니다:
- ✅ 반응형 디자인
- ✅ 터치 제스처 지원
- ✅ 모바일 Safari 호환

---

**배포 성공하면 URL을 공유해주세요! 🚀**
