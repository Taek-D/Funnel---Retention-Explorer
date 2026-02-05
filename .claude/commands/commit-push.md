현재 변경사항을 분석하고 커밋 & 푸시합니다.

## 작업 순서

1. `git status`로 변경된 파일 목록 확인
2. `git diff`로 변경 내용 분석
3. 변경 내용에 맞는 conventional commit 메시지 작성:
   - `feat:` 새 기능
   - `fix:` 버그 수정
   - `refactor:` 리팩토링
   - `style:` 스타일/UI 변경
   - `docs:` 문서 변경
4. 변경 파일을 개별적으로 `git add` (git add -A 사용 금지)
5. 커밋 메시지는 영어로 작성
6. `git push`로 원격에 반영

## 주의사항

- 커밋 전 변경 내용을 사용자에게 보여주고 확인받을 것
- pdf_font_noto_sans_kr.js가 변경 목록에 있으면 경고
- .env, 인증정보 등 민감 파일이 포함되어 있으면 경고
