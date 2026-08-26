import { getPublicPosts, xmlEscape } from '../utils/public-posts'

const siteUrl = 'https://minnong511.github.io'
const staticPaths = ['/', '/about/', '/archive/', '/tags/', '/search/']

export default defineEventHandler(async (event) => {
  const posts = await getPublicPosts(event)
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=0, must-revalidate')

  const staticUrls = staticPaths.map((path) => `<url><loc>${xmlEscape(new URL(path, siteUrl))}</loc></url>`)
  const postUrls = posts.map((post) => [
    '<url>',
    `<loc>${xmlEscape(new URL(post.legacyPath, siteUrl))}</loc>`,
    `<lastmod>${xmlEscape(new Date(post.last_modified_at || post.date).toISOString())}</lastmod>`,
    '</url>'
  ].join(''))

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...staticUrls, ...postUrls].join('')}</urlset>`
})
