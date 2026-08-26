<script setup lang="ts">
useSiteSeo({
  title: 'About',
  description: 'AI와 소프트웨어를 공부하며 배운 내용을 기록하는 이민형의 블로그입니다.',
})
</script>

<template>
  <section class="ide-page" aria-labelledby="pageTitle">
    <header class="ide-document-header">
      <div class="ide-document-meta">
        <strong>PAGE</strong>
        <span>MINNONG WORKSPACE</span>
      </div>
      <h1 id="pageTitle">About</h1>
    </header>

    <article class="ide-document-content prose">
      <p class="page-lead">배운 내용을 흘려보내지 않고, 다시 설명할 수 있는 지식으로 만드는 공간입니다.</p>

      <h2>About me</h2>
      <p>안녕하세요. AI와 소프트웨어를 공부하고 있는 <strong>Min Hyeong Lee</strong>입니다. 새로운 개념을 만났을 때 단순히 외우기보다 직접 실험하고, 제 언어로 다시 정리하는 과정을 좋아합니다.</p>

      <h2>What I log</h2>
      <ul>
        <li><strong>Artificial Intelligence</strong> — 딥러닝, 멀티모달, 모델 학습과 평가</li>
        <li><strong>Computer Science</strong> — 알고리즘, 자료구조, 개발 기초</li>
        <li><strong>Paper Review</strong> — 읽은 논문의 핵심 아이디어와 재현 포인트</li>
        <li><strong>Build Notes</strong> — 프로젝트에서 만난 문제와 해결 과정</li>
      </ul>

      <h2>Connect</h2>
      <div class="about-link-grid">
        <a
          href="https://github.com/minnong511"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub에서 코드와 프로젝트 보기, 새 창에서 열림"
        >
          <i class="ri-github-fill" aria-hidden="true" />
          <strong>GitHub</strong>
          <span>코드와 프로젝트 보기</span>
        </a>
        <a
          href="https://www.linkedin.com/in/min-hyeong-lee-225294270/"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn에서 프로필과 경력 보기, 새 창에서 열림"
        >
          <i class="ri-linkedin-box-fill" aria-hidden="true" />
          <strong>LinkedIn</strong>
          <span>프로필과 경력 보기</span>
        </a>
        <a
          href="https://www.instagram.com/minnong511/"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram에서 일상의 장면 보기, 새 창에서 열림"
        >
          <i class="ri-instagram-line" aria-hidden="true" />
          <strong>Instagram</strong>
          <span>일상의 장면 보기</span>
        </a>
      </div>
    </article>
  </section>
</template>
