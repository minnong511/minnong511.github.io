import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const flexibleList = z.array(z.string()).optional()

export default defineContentConfig({
  collections: {
    posts: defineCollection({
      type: 'page',
      source: 'posts/**/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.string(),
        last_modified_at: z.string().optional(),
        categories: z.array(z.string()).default([]),
        tags: z.array(z.string()).default([]),
        legacyPath: z.string(),
        published: z.boolean().default(true),
        series: z.string().optional(),
        part: z.union([z.string(), z.number()]).optional(),
        summary: z.string().optional(),
        key_concepts: flexibleList,
        strengths: flexibleList,
        tradeoffs: flexibleList,
        image: z.string().optional(),
        robots: z.string().optional()
      })
    })
  }
})
