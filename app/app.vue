<script setup lang="ts">
const workspace = useWorkspaceState()

useHead(() => ({
  htmlAttrs: { lang: 'ko' },
  bodyAttrs: { class: 'site-body' },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
    { name: 'theme-color', content: workspace.theme.value === 'light' ? '#f2f4f6' : '#090a0c' },
    { name: 'referrer', content: 'strict-origin-when-cross-origin' },
  ],
  link: [
    { rel: 'preconnect', href: 'https://cdn.jsdelivr.net', crossorigin: 'anonymous' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
    { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@1.3.9/dist/web/static/pretendard.css' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap' },
    { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/remixicon@4.6.0/fonts/remixicon.css' },
  ],
  script: [{
    key: 'ide-preferences-init',
    textContent: `try{var t=localStorage.getItem('minnong-theme');var f=localStorage.getItem('minnong-font-size');document.documentElement.dataset.theme=t==='light'?'light':'dark';document.documentElement.dataset.fontSize=f==='small'||f==='large'?f:'medium'}catch(e){document.documentElement.dataset.theme='dark';document.documentElement.dataset.fontSize='medium'}`,
  }],
}))
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style src="../assets/css/home-mag.css"></style>
<style src="../assets/css/tokens.css"></style>
<style src="../assets/css/ide.css"></style>
<style src="./assets/css/nuxt-ide.css"></style>
