import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface MigrationEntry {
  visibility?: string
  legacyPath?: string
  route?: string
}

interface MigrationManifest {
  entries?: MigrationEntry[]
  posts?: MigrationEntry[]
}

function readPublicRoutes() {
  const manifestPath = resolve(process.cwd(), 'data/public-content-manifest.json')
  if (!existsSync(manifestPath)) return []

  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as MigrationManifest
    return [...new Set((manifest.entries || manifest.posts || [])
      .filter((entry) => entry.visibility !== 'draft')
      .map((entry) => entry.legacyPath || entry.route)
      .filter((route): route is string => Boolean(route)))]
  } catch (error) {
    console.warn('[nuxt] 콘텐츠 경로 manifest를 읽지 못했습니다.', error)
    return []
  }
}

const contentRoutes = readPublicRoutes()
const staticRoutes = ['/', '/about/', '/archive/', '/tags/', '/search/', '/404.html', '/feed.xml', '/search.json', '/sitemap.xml', '/robots.txt']

export default defineNuxtConfig({
  compatibilityDate: '2026-08-26',
  modules: ['@nuxt/content', '@nuxt/eslint'],
  devtools: { enabled: false },
  ssr: true,
  content: {
    experimental: {
      sqliteConnector: 'native'
    }
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'referrer', content: 'strict-origin-when-cross-origin' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://cdn.jsdelivr.net', crossorigin: 'anonymous' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@1.3.9/dist/web/static/pretendard.css' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap' },
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/remixicon@4.6.0/fonts/remixicon.css' },
        { rel: 'alternate', type: 'application/atom+xml', title: "Minnong's Study Log", href: '/feed.xml' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      siteUrl: 'https://minnong511.github.io',
      siteName: "Minnong's Study Log",
      siteDescription: '개발과 AI를 배우고, 실험하고, 이해한 내용을 연결하는 공부 기록',
      author: 'Min Hyeong Lee',
      defaultOgImage: '/assets/base_image/og-study-blog.png',
      giscus: {
        repo: 'minnong511/minnong511.github.io',
        repoId: 'R_kgDONte4cw',
        category: 'General',
        categoryId: 'DIC_kwDONte4c84C3PLr'
      }
    }
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: [...new Set([...staticRoutes, ...contentRoutes])]
    }
  },
  typescript: {
    typeCheck: true,
    strict: true
  }
})
