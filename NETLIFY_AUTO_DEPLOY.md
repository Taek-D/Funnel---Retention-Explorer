# 🔄 Netlify 자동 배포 설정 가이드

## ✅ 준비 완료
- GitHub 저장소: `https://github.com/Taek-D/Funnel---Retention-Explorer.git`
- 최신 코드 푸시 완료 ✓

---

## 📋 Netlify GitHub 연동 단계

### 1단계: Netlify에 로그인

1. **Netlify 사이트 접속**
   ```
   https://app.netlify.com
   ```

2. **로그인** 또는 **Sign up**
   - GitHub 계정으로 로그인 추천 (더 빠름)
   - 또는 이메일로 가입

---

### 2단계: 기존 사이트 확인

**현재 상황:**
- Netlify Drop으로 이미 배포한 사이트가 있음
- 이 사이트를 GitHub 저장소와 연결할 예정

**옵션 A: 기존 사이트 업그레이드** (추천)
1. Netlify 대시보드에서 기존 사이트 선택
2. **Site settings** 클릭
3. **Build & deploy** → **Link repository** 클릭
4. GitHub 선택 → 저장소 선택:
   ```
   Taek-D/Funnel---Retention-Explorer
   ```
5. **Link repository** 클릭

**옵션 B: 새 사이트 생성**
1. Netlify 대시보드에서 **Add new site** → **Import an existing project**
2. GitHub 선택
3. 저장소 선택: `Taek-D/Funnel---Retention-Explorer`
4. 다음 설정 사용:
   - **Branch to deploy**: `main`
   - **Build command**: *(비워두기)*
   - **Publish directory**: `.` 또는 비워두기
5. **Deploy site** 클릭

---

### 3단계: 배포 설정 확인

연동 후 자동으로 첫 배포가 시작됩니다:

1. **Deploys** 탭에서 진행 상황 확인
2. 약 30초 후 배포 완료 ✅
3. 사이트 URL 확인

---

### 4단계: 자동 배포 테스트

이제부터 코드를 수정하면 **자동으로 배포**됩니다!

**테스트 방법:**

```bash
# 1. 파일 수정 (예: README.md)
# 2. Git 커밋 및 푸시
git add .
git commit -m "Test auto deploy"
git push origin main

# 3. Netlify에서 자동 배포 시작!
```

**Netlify에서 확인:**
- **Deploys** 탭 → 새 배포가 자동으로 시작됨
- 약 30초 후 업데이트 완료

---

## 🎯 배포 설정 최적화

### Build Settings (선택사항)

기본적으로 정적 사이트이므로 빌드 불필요하지만, 원하면 설정 가능:

**Site settings** → **Build & deploy** → **Build settings**

```
Build command: (비워두기)
Publish directory: .
```

### 환경 변수 (필요시)

**Site settings** → **Build & deploy** → **Environment**

예시:
```
NODE_VERSION=18
```

### Deploy 알림

**Site settings** → **Build & deploy** → **Deploy notifications**

- Slack 알림
- 이메일 알림
- GitHub commit status
등 설정 가능

---

## 🔔 브랜치 배포 설정

여러 환경 관리 (고급):

### Production (main 브랜치)
- 자동 배포: ✅ 활성화됨
- URL: `https://funnel-retention-explorer.netlify.app`

### Staging (develop 브랜치) - 선택사항
1. **Site settings** → **Build & deploy** → **Branch deploys**
2. **Let me add individual branches** 선택
3. `develop` 브랜치 추가
4. 이후 develop 푸시 시 별도 URL로 배포

---

## 📊 배포 상태 확인

### Netlify Status Badge

README.md에 추가하면 배포 상태 표시:

```markdown
[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR-SITE-ID/deploy-status)](https://app.netlify.com/sites/YOUR-SITE-NAME/deploys)
```

**Site ID 확인:**
- **Site settings** → **Site details** → **API ID**

---

## 🐛 문제 해결

### 배포가 실패해요
1. **Deploys** 탭 → 실패한 배포 클릭
2. **Deploy log** 확인
3. 에러 메시지 읽고 수정

### 자동 배포가 안 돼요
1. **Site settings** → **Build & deploy** → **Build hooks**
2. GitHub 저장소와 연결 확인
3. **Deploy contexts** 확인 (main 브랜치 활성화 여부)

### 이전 Drop 사이트가 남아있어요
1. 불필요한 사이트 삭제:
   - **Site settings** → **Site details** → **Delete site**
2. GitHub 연동한 사이트만 유지

---

## 💡 워크플로우 예시

### 일반적인 개발 흐름

```bash
# 1. 로컬에서 개발
code app.js

# 2. 테스트
open index.html

# 3. 커밋 및 푸시
git add .
git commit -m "Add new feature"
git push origin main

# 4. Netlify 자동 배포 (30초)
# 5. 배포 완료 → URL에서 확인!
```

### 롤백 (이전 버전으로 되돌리기)

문제가 있는 배포를 롤백하려면:

1. **Deploys** 탭
2. 이전 성공한 배포 선택
3. **Publish deploy** 클릭
4. 즉시 이전 버전으로 복구!

---

## 🎉 자동 배포 완료!

이제부터:
- ✅ 코드 수정 → Git push → **자동 배포**
- ✅ 매번 수동 업로드 불필요
- ✅ 배포 히스토리 자동 관리
- ✅ 문제 시 원클릭 롤백

**개발에 집중하세요! Netlify가 배포를 자동으로 처리합니다.** 🚀

---

## 📱 모바일에서도 확인

Netlify 모바일 앱:
- iOS: App Store
- Android: Google Play

→ 이동 중에도 배포 상태 확인 가능!
