export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return [
    'User-agent: *',
    'Allow: /',
    'Sitemap: https://minnong511.github.io/sitemap.xml',
    ''
  ].join('\n')
})
