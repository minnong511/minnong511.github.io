# GitHub Blog Writer

브라우저에서 Markdown 글을 작성하고 GitHub Pages/Jekyll용 `.md` 파일로 내보내는 독립형 정적 도구입니다. 기존 블로그와 연결하지 않아도 `blog-writer/` 폴더만 복사해 사용할 수 있습니다.

## 실행 방법

### Live Server

1. VS Code에서 `blog-writer/index.html`을 엽니다.
2. Live Server 확장 기능의 **Open with Live Server**를 실행합니다.
3. 브라우저에서 표시된 주소를 엽니다.

### Python 정적 서버

프로젝트 루트에서 다음을 실행합니다.

```bash
python3 -m http.server 8000
```

그 다음 `http://localhost:8000/blog-writer/`를 엽니다. 별도 설치, 백엔드, 데이터베이스, 로그인, 외부 API가 필요하지 않습니다.

## 사용 방법

1. 제목을 입력하면 파일명용 slug가 자동으로 만들어집니다. slug는 직접 수정할 수 있습니다.
2. 작성일, 작성 시간, 작성자, 카테고리, 태그, 대표 이미지 경로, 공개 여부를 입력합니다.
3. 본문을 Markdown으로 작성합니다. 편집/미리보기 전환, 실시간 미리보기, 새 창 미리보기, 기본 문법 삽입 버튼을 사용할 수 있습니다.
4. **임시 저장**을 누르거나 잠시 기다리면 초안이 브라우저에 자동 저장됩니다.
5. 오른쪽 **Markdown 다운로드**를 누르면 기본 파일명인 `YYYY-MM-DD-slug.md`로 저장됩니다.
6. 설정에서 기본 layout, 작성자, 카테고리, 태그, 날짜 형식, 시간대, 이미지 경로, Front Matter 키 이름, 테마, 미리보기 너비, 자동 저장 주기를 변경할 수 있습니다.

## 초안 저장 위치

초안과 설정은 현재 브라우저의 `localStorage`에 각각 `blog-writer-drafts-v1`, `blog-writer-settings-v1` 키로 저장됩니다. 서버나 GitHub 저장소로 전송되지 않습니다. 브라우저 사이트 데이터 또는 localStorage를 초기화하면 초안이 사라질 수 있으므로 중요한 글은 Markdown으로 먼저 내보내세요.

손상된 localStorage 값은 기본값으로 처리하도록 예외 처리되어 있습니다. 브라우저의 저장 공간 제한이나 개인정보 보호 모드에 따라 저장이 제한될 수 있습니다.

## Markdown 파일을 Jekyll에 넣기

1. Markdown 파일을 Jekyll 저장소의 `_posts/` 폴더에 복사합니다.
2. 파일명이 `YYYY-MM-DD-slug.md` 형식인지 확인합니다.
3. Front Matter의 `layout`과 키 이름이 사용하는 Jekyll 테마와 맞는지 확인합니다.
4. 대표 이미지가 있다면 이미지 파일을 저장소의 `assets/images/` 폴더에 추가하고, Front Matter와 본문의 경로를 실제 경로와 맞춥니다.

예를 들어 `blog-writer/sample/example-post.md`를 `_posts/2026-07-30-postgresql-index.md`로 복사할 수 있습니다.

### 이미지 처리

브라우저에서 이미지가 GitHub 저장소로 자동 업로드되지는 않습니다. 이미지 도우미에서 다음 중 하나를 선택하세요.

- 저장소에 이미 존재하는 이미지 경로를 직접 입력
- 이미지 Markdown만 본문에 삽입
- 선택한 로컬 이미지를 별도로 다운로드한 뒤 `assets/images/`에 복사

## GitHub Pages 게시 흐름

일반적으로 로컬에서 Markdown과 이미지를 저장소에 추가하고, 변경 사항을 확인한 뒤 Git 커밋과 push를 수행합니다. GitHub Actions 또는 GitHub Pages의 Jekyll 빌드가 완료되면 사이트에서 게시 결과를 확인합니다. 이 도구는 저장소에 직접 push하거나 GitHub API를 호출하지 않습니다.

## 지원 기능

- 제목 기반 slug 자동 생성 및 직접 수정
- 제목, 날짜, 시간, 작성자, 카테고리, 태그, 대표 이미지 경로, 공개 여부, 본문 입력
- 제목, 굵게, 기울임, 인용문, 목록, 링크, 이미지, 코드 블록, 인라인 코드, 표, 수평선 Markdown
- 실시간 미리보기, 편집/미리보기 전환, 새 창 미리보기
- Tab 들여쓰기와 현재 커서 줄/열, 글자 수/단어 수 표시
- Jekyll Front Matter 생성 및 키 이름 설정
- Markdown 다운로드, 선택 폴더 저장(File System Access API 지원 브라우저), 클립보드 복사, HTML 미리보기 저장
- 자동 저장, 초안 불러오기/삭제, 제목·태그 검색, 카테고리 필터, 작성일·수정일 정렬
- 로컬 이미지 미리보기, 이미지 Markdown 삽입, 이미지 별도 다운로드
- 데스크톱 3영역, 태블릿 2영역, 모바일 화면 전환형 반응형 레이아웃
- HTML과 script가 실행되지 않는 안전한 미리보기

## 브라우저 호환성 및 제한사항

- 최신 Chrome, Edge, Safari, Firefox에서 기본 작성·미리보기·다운로드 기능을 사용할 수 있습니다.
- File System Access API를 지원하지 않는 브라우저에서는 **폴더에 저장**이 일반 파일 다운로드로 대체됩니다.
- 클립보드 권한이 제한된 환경에서는 브라우저의 복사 명령으로 대체합니다.
- Markdown 렌더러는 외부 CDN이나 라이브러리를 사용하지 않는 작은 내장 파서입니다. 복잡한 확장 문법, HTML, Mermaid, 수식은 지원하지 않으며 안전을 위해 HTML을 실행하지 않습니다.
- 미리보기 이미지는 입력한 경로가 실제로 존재하는지 확인하지 않습니다. 파일을 저장소에 직접 추가해야 합니다.
- 여러 초안은 같은 브라우저 프로필과 사이트 저장 공간 안에서만 보입니다.

## 라이선스

외부 Markdown 라이브러리를 사용하지 않습니다. 이 폴더의 HTML, CSS, JavaScript, 샘플 파일은 프로젝트의 기존 라이선스 정책을 따릅니다.
