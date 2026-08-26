Min Hyeong
Minnong’s Study Log
Nuxt 4, Vue 3, TypeScript, Nuxt Content 3으로 만든 정적 기술 블로그입니다.

로컬 실행
Node.js 24 LTS와 npm을 기준으로 합니다.

npm ci
npm run dev
정적 결과물은 다음 명령으로 생성합니다.

npm run generate
생성 결과는 .output/public에 저장됩니다.

글 작성
공개 글은 content/posts/<카테고리>/<YYYY-MM-DD-slug>.md, 사이트에 게시하지 않을 초안은 drafts/<카테고리>/<YYYY-MM-DD-slug>.md에 저장합니다.

drafts/의 글은 정적 사이트와 검색 데이터에서는 제외되지만, 공개 GitHub 저장소에 커밋하면 원본 파일은 보일 수 있습니다. 외부에 공개하면 안 되는 내용은 이 저장소에 저장하지 않습니다.

npm run post:new -- \
  --title "OCI 컨테이너 표준" \
  --category "DevOps/Docker" \
  --description "OCI 표준을 정리한다." \
  --tags "Docker,OCI"
초안은 --draft를 붙입니다.

npm run post:new -- \
  --title "작성 중인 글" \
  --category "DevOps" \
  --draft
기본 front matter는 다음 필드를 사용합니다.

---
title: "글 제목"
description: "글 설명"
date: "2026-08-26T00:00:00+09:00"
categories: ["DevOps", "Docker"]
tags: ["Docker"]
legacyPath: "/devops/docker/2026/08/26/slug/"
published: true
---
기존 URL 호환을 위해 legacyPath의 대소문자, 밑줄, 마지막 /를 그대로 유지합니다. 새 공개 글은 다음 npm run dev, npm run build, npm run generate 실행 전에 콘텐츠 인덱스에 자동 반영됩니다.

검증
npm run verify
이 명령은 콘텐츠 전수 검사, ESLint, 타입 검사, 단위 테스트, 정적 생성을 차례로 실행합니다. 마이그레이션에서 자동 보완한 메타데이터와 경고는 reports/content-migration.json에서 확인할 수 있습니다.

GitHub Pages 배포
.github/workflows/deploy.yml은 master 브랜치의 .output/public을 GitHub Pages에 배포합니다. 첫 배포 전에 저장소의 Settings → Pages → Build and deployment → Source를 GitHub Actions로 변경해야 합니다.

저장소 설정 변경, 커밋, push는 이 전환 작업에 포함하지 않습니다.