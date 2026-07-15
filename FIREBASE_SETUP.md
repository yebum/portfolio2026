# Portfolio Guestbook Firebase Setup

방명록 UI와 Firebase 연결 코드는 적용되어 있습니다. 실제 등록·조회 기능을 사용하려면 Firebase Console에서 아래 설정을 완료하세요.

## 1. Firestore 생성

1. Firebase Console에서 `portfolio2026-987e6` 프로젝트를 엽니다.
2. **빌드 → Firestore Database → 데이터베이스 만들기**를 선택합니다.
3. 운영 모드로 생성하고, 방문자와 가까운 리전을 선택합니다.

## 2. 익명 로그인 활성화

1. **빌드 → Authentication → Sign-in method**로 이동합니다.
2. **익명** 제공업체를 활성화합니다.
3. 배포 주소가 GitHub Pages라면 **Settings → Authorized domains**에서 배포 도메인을 확인합니다.

## 3. Firestore 보안 규칙 적용

Firebase Console의 **Firestore Database → 규칙**에 `firestore.rules` 내용을 붙여넣고 게시합니다.

Firebase CLI를 사용하는 경우 프로젝트 루트에서 다음 명령으로 규칙만 배포할 수 있습니다.

```text
firebase deploy --only firestore:rules --project portfolio2026-987e6
```

## 4. 권장 보안 설정

- Firebase App Check에서 웹 앱을 등록하고 Firestore 요청 검증을 활성화합니다.
- Firebase Console의 Firestore 사용량 화면에서 읽기·쓰기 사용량을 확인합니다.
- Blaze 요금제로 전환할 경우 Google Cloud 예산 알림도 설정합니다.

방명록은 `guestbook` 컬렉션을 사용하며 최근 메시지 8개만 조회합니다. 방문자는 글을 작성하고 읽을 수 있지만 수정하거나 삭제할 수 없습니다.
