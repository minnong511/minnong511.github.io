| 기능 | 의미 |
|---|---|
| Issue | 해야 할 작업을 기록하는 티켓 |
| Project | Issue들을 모아 관리하는 칸반 보드 |
| Milestone | `백엔드 MVP` 같은 개발 단계 |
| Branch | 기존 코드를 보호하며 작업하는 별도 공간 |
| Pull Request | 작업 내용을 `main`에 합쳐달라는 요청 |
| Merge | Pull Request 내용을 실제로 `main`에 합치는 것 |

# 1. GitHub Project 만들기

- GitHub 오른쪽 위의 프로필 사진을 누른다.
- Your profile을 누른다.
- 프로필 화면에서 Projects 탭을 누른다.
- 초록색 New project 버튼을 누른다.
- Start from scratch 아래에서 Board를 선택한다.
- 프로젝트 이름에 다음을 입력한다.

- Create project 버튼을 누른다.

그러면 기본적으로 다음 칸이 있는 보드가 만들어진다.

- Todo: 아직 시작하지 않은 작업
- In Progress: 진행 중인 작업
- Done: 완료된 작업

작업 카드를 마우스로 끌어서 다른 칸으로 옮기면 상태가 변경

## Project를 공개로 설정하기

포트폴리오이므로 Project도 공개하는 것이 좋다.

- Project 화면 오른쪽 위의 ⋯ 버튼을 누른다.
- Settings를 누른다.
- 화면 아래 Danger zone으로 내려간다.
- Visibility에서 Public을 선택한다.
- 변경 확인 버튼을 누른다.

# 2. Project와 저장소 연결하기

- pi-monitor 저장소로 이동한다.
- 저장소 위쪽의 Projects 탭을 누른다.
- Link a project 버튼을 누른다.
- 방금 만든 Pi Monitor Roadmap을 검색한다.
- 검색 결과를 클릭한다.

이제 저장소의 Projects 탭에서 개발 계획을 바로 확인할 수 있다

# 3. 첫 번째 Milestone 만들기

Milestone은 하나의 개발 단계를 의미한다. 현재 작업은 백엔드 MVP 단계로 묶으면 된다.

- 저장소 위쪽의 Issues를 누른다.
- 화면 오른쪽 부근의 Milestones를 누른다.
- New milestone을 누른다.

다음과 같이 입력한다.

- 제목: `v0.1 Backend MVP`
- 설명: `센서 데이터를 PostgreSQL에 저장하고 조회하는 기본 백엔드 완성`

Due date는 마감일이다. 아직 정하지 않았다면 비워둬도 된다.

중에는 다음 Milestone을 추가하면 된다.

- `v0.2 Raspberry Integration`
- `v0.3 Realtime Dashboard`
- `v1.0 Portfolio Release`

지금은 v0.1 Backend MVP 하나만 만들어도 충분하다.

# 4. 첫 번째 Issue 만들기

- 저장소의 Issues 탭을 누른다.
- 초록색 New issue 버튼을 누른다.
- 템플릿 선택 화면이 나오면 Open a blank issue를 누른다.
- 제목에 다음을 입력한다.

`센서 데이터 저장 및 조회 API 구현`

본문에 다음 내용을 붙여 넣는다.

```markdown
## 목표

센서 데이터를 PostgreSQL에 저장하고 조회할 수 있다.

## 작업

- [x] SensorData Entity 작성
- [x] Repository 작성
- [x] POST API 구현
- [x] 전체 조회 API 구현
- [x] 최신 조회 API 구현
- [x] PostgreSQL 저장 확인

## 완료 조건

- [x] POST 요청이 HTTP 201을 반환한다.
- [x] PostgreSQL에 데이터가 저장된다.
- [x] GET /api/sensors/latest가 최신 데이터를 반환한다.
```

화면 오른쪽 설정은 다음과 같이 지정한다.

- Assignees → 자기 GitHub 계정 선택
- Labels → enhancement가 있으면 선택
- Projects → Pi Monitor Roadmap 선택
- Milestone → v0.1 Backend MVP 선택

마지막으로 Submit new issue를 누른다.

Issue가 생성되면 제목 옆에 #1 같은 번호가 생긴다. 이 번호를 기억한다. 반드시 #1일 필요는 없고, 화면에 나온 번호를 사용하면 된다.

GitHub 공식 Issue 생성 안내

# 5. Issue 상태를 진행 중으로 변경하기

- Pi Monitor Roadmap Project로 이동한다.
- 방금 만든 Issue 카드가 Todo에 있는지 확인한다.
- 카드를 마우스로 잡는다.
- In Progress 칸으로 끌어 놓는다.

현재 코드는 완성됐지만 아직 main 브랜치에 합치기 전이므로, Pull Request가 끝날 때까지는 In Progress가 적당하다.

# 6. 현재 코드를 별도 Branch에 커밋하기

터미널에서 다음 명령을 순서대로 실행한다.

```bash
cd ~/pi-monitor
git switch -c feat/sensor-api
git status
```

현재 작업 내용을 안전하게 feat/sensor-api 브랜치로 옮긴 것이다.

센서 API 파일만 추가한다.

```bash
git add backend/src/main/java/com/raspmonitor/rasp_monitor/domain/SensorData.java \
        backend/src/main/java/com/raspmonitor/rasp_monitor/dto/SensorDataRequest.java \
        backend/src/main/java/com/raspmonitor/rasp_monitor/repository/SensorDataRepository.java \
        backend/src/main/java/com/raspmonitor/rasp_monitor/service/SensorDataService.java \
        backend/src/main/java/com/raspmonitor/rasp_monitor/controller/SensorDataController.java
```

커밋 전 문제가 없는지 검사한다.

```bash
git diff --cached --check
```

아무것도 출력되지 않으면 정상이다. 이제 커밋한다.

```bash
git commit -m "feat(backend): add sensor data API"
```

개발노트는 별도 커밋으로 남긴다.

```bash
git add backend_개발노트.md
git commit -m "docs: update backend development notes"
```

GitHub에 브랜치를 올린다.

```bash
git push -u origin feat/sensor-api
```

git add . 대신 파일을 직접 지정한 이유는 비밀번호나 불필요한 파일이 실수로 올라가는 것을 방지하기 위해서다.

# 7. Pull Request 만들기

- git push가 성공하면 GitHub 저장소 페이지를 새로고침한다.
- 화면 위에 노란색 안내창이 나타나는지 확인한다.
- Compare & pull request 버튼을 누른다.

위쪽 브랜치 설정을 확인한다.

```text
base: main
compare: feat/sensor-api
```

base는 작업을 합칠 목적지이고, compare는 방금 만든 작업 브랜치다.

Pull Request 제목을 입력한다.

`feat(backend): 센서 데이터 API 구현`

본문에 다음을 붙여 넣는다.

```markdown
## 구현 내용

- SensorData Entity, DTO 구현
- Repository, Service, Controller 구현
- POST /api/sensors 구현
- GET /api/sensors 구현
- GET /api/sensors/latest 구현

## 테스트

- [x] PostgreSQL 저장 확인
- [x] POST 요청 HTTP 201 확인
- [x] 전체 센서 데이터 조회 확인
- [x] 최신 센서 데이터 조회 확인

Closes #1
```

여기서 #1은 앞에서 만든 실제 Issue 번호로 바꿔야 한다.
Closes #1을 작성하면 Pull Request가 합쳐질 때 해당 Issue도 자동으로 닫힌다.

- 초록색 Create pull request 버튼을 누른다.

GitHub 공식 Pull Request 생성 안내

# 8. 변경된 코드 확인하기

Pull Request 화면에는 다음 탭이 있다.

- Conversation: 설명, 대화, 커밋 상태
- Commits: 포함된 커밋 목록
- Checks: 자동 테스트 결과
- Files changed: 실제 변경된 코드

Files changed를 눌러 다음을 확인한다.

- 비밀번호가 포함되지 않았는지
- .env 같은 환경설정 파일이 올라가지 않았는지
- 센서 API와 개발노트만 변경됐는지

문제가 없다면 다시 Conversation 탭으로 돌아간다.

# 9. Pull Request 합치기

- Conversation 화면 아래로 내려간다.
- 초록색 Merge pull request 버튼을 누른다.
- Confirm merge를 누른다.
- 합쳐진 후 Delete branch 버튼이 나타나면 누른다.

Delete branch는 GitHub에 있는 작업 브랜치만 제거한다. main 브랜치와 합쳐진 코드는 삭제되지 않는다.

Closes #번호가 제대로 작성됐다면:

- Issue가 자동으로 Closed 처리된다.
- Project 카드도 자동으로 Done이 될 수 있다.

자동으로 이동하지 않으면 Project에서 직접 Done으로 끌어 놓으면 된다.

# 10. 로컬 컴퓨터 정리하기

Pull Request를 합친 뒤 터미널에서 실행한다.

```bash
cd ~/pi-monitor
git switch main
git pull
git branch -d feat/sensor-api
```

마지막 상태를 확인한다.

```bash
git status
```

다음과 비슷하게 나오면 완료다.

```text
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

이 과정을 마치면 포트폴리오에서 단순히 “코드를 작성했다”가 아니라 다음 기록이 모두 남는다.

- 개발 계획 Project
- 백엔드 목표 Milestone
- 작업 요구사항 Issue
- 기능별 커밋
- 코드 검토 기록 Pull Request
- PostgreSQL 연동 테스트 내용
