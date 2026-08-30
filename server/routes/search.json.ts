import { contentText, getPublicPosts } from '../utils/public-posts'

export default defineEventHandler(async (event) => {
  const posts = await getPublicPosts(event)
  setHeader(event, 'content-type', 'application/json; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=0, must-revalidate')

  return posts.map((post) => ({
    title: post.title,
    description: post.description,
    url: post.legacyPath,
    date: post.date,
    categories: post.categories,
    tags: post.tags,
    content: contentText(post.body).replace(/\s+/g, ' ').trim()
  }))
})
