import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

import { normalizeContentPath } from '~/utils/content'

type SiteSeoType = 'website' | 'article'

interface SiteSeoArticle {
  publishedTime: MaybeRefOrGetter<string>
  modifiedTime?: MaybeRefOrGetter<string | undefined>
  section?: MaybeRefOrGetter<string | undefined>
  tags?: MaybeRefOrGetter<readonly string[] | undefined>
}

interface SiteSeoOptions {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  path?: MaybeRefOrGetter<string | undefined>
  type?: SiteSeoType
  image?: MaybeRefOrGetter<string | undefined>
  robots?: MaybeRefOrGetter<string | undefined>
  article?: SiteSeoArticle
}

function absoluteUrl(siteUrl: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value
  return `${siteUrl}${value.startsWith('/') ? '' : '/'}${value}`
}

export function useSiteSeo(options: SiteSeoOptions) {
  const route = useRoute()
  const config = useRuntimeConfig()
  const siteUrl = String(config.public.siteUrl).replace(/\/+$/, '')
  const siteName = String(config.public.siteName)
  const author = String(config.public.author)

  const pageTitle = computed(() => String(toValue(options.title) || siteName))
  const description = computed(() => String(toValue(options.description) || config.public.siteDescription))
  const documentTitle = computed(() => pageTitle.value === siteName
    ? siteName
    : `${pageTitle.value} · ${siteName}`)
  const canonicalUrl = computed(() => {
    const path = normalizeContentPath(toValue(options.path) || route.path)
    return absoluteUrl(siteUrl, path)
  })
  const imageUrl = computed(() => absoluteUrl(
    siteUrl,
    String(toValue(options.image) || config.public.defaultOgImage),
  ))
  const publishedTime = computed(() => options.article
    ? String(toValue(options.article.publishedTime) || '')
    : undefined)
  const modifiedTime = computed(() => options.article
    ? String(toValue(options.article.modifiedTime) || publishedTime.value || '')
    : undefined)
  const articleSection = computed(() => options.article
    ? String(toValue(options.article.section) || '') || undefined
    : undefined)
  const articleTags = computed(() => options.article
    ? [...(toValue(options.article.tags) || [])]
    : undefined)

  useSeoMeta({
    title: () => documentTitle.value,
    description: () => description.value,
    robots: () => toValue(options.robots) || undefined,
    ogSiteName: siteName,
    ogType: options.type || 'website',
    ogTitle: () => pageTitle.value,
    ogDescription: () => description.value,
    ogUrl: () => canonicalUrl.value,
    ogImage: () => imageUrl.value,
    articlePublishedTime: () => publishedTime.value,
    articleModifiedTime: () => modifiedTime.value,
    articleSection: () => articleSection.value,
    articleTag: () => articleTags.value,
    twitterCard: 'summary_large_image',
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => description.value,
    twitterImage: () => imageUrl.value,
  })

  useHead(() => ({
    link: [{ key: 'canonical', rel: 'canonical', href: canonicalUrl.value }],
  }))

  return {
    author,
    canonicalUrl,
    imageUrl,
    siteName,
  }
}
