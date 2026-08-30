import { contentText, getPublicPosts, xmlEscape } from '../utils/public-posts'

const siteUrl = 'https://minnong511.github.io'

export default defineEventHandler(async (event) => {
  const posts = (await getPublicPosts(event)).slice(0, 10)
  setHeader(event, 'content-type', 'application/atom+xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=0, must-revalidate')

  const entries = posts.map((post) => {
    const url = new URL(post.legacyPath, siteUrl).toString()
    const summary = contentText(post.body).replace(/\s+/g, ' ').trim().slice(0, 500)
    return [
      '<entry>',
      `<title>${xmlEscape(post.title)}</title>`,
      `<link href="${xmlEscape(url)}"/>`,
      `<id>${xmlEscape(url)}</id>`,
      `<published>${xmlEscape(new Date(post.date).toISOString())}</published>`,
      `<updated>${xmlEscape(new Date(post.last_modified_at || post.date).toISOString())}</updated>`,
      `<summary type="html">${xmlEscape(summary || post.description)}</summary>`,
      '</entry>'
    ].join('')
  }).join('')

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    "<title>Minnong&apos;s Study Log</title>",
    `<link href="${siteUrl}/feed.xml" rel="self"/>`,
    `<link href="${siteUrl}/"/>`,
    `<id>${siteUrl}/</id>`,
    `<updated>${posts[0] ? xmlEscape(new Date(posts[0].last_modified_at || posts[0].date).toISOString()) : new Date(0).toISOString()}</updated>`,
    '<author><name>Min Hyeong Lee</name></author>',
    entries,
    '</feed>'
  ].join('')
})
