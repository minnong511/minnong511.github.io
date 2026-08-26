export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  return `<!doctype html>
<html lang="ko" data-theme="dark">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>404 · Minnong's Study Log</title>
    <style>
      :root { color-scheme: dark; font-family: "IBM Plex Mono", monospace; background: #090a0c; color: #d6d9df; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; }
      main { width: min(36rem, calc(100% - 3rem)); border: 1px solid #30343b; padding: 3rem; }
      span { color: #8b929d; letter-spacing: .14em; }
      h1 { margin: .6rem 0 1rem; font-size: clamp(2.5rem, 8vw, 5rem); }
      p { color: #aeb4be; line-height: 1.7; }
      a { color: #fff; text-underline-offset: .25em; }
    </style>
  </head>
  <body><main><span>FILE NOT FOUND</span><h1>404</h1><p>요청한 문서를 찾을 수 없습니다.</p><a href="/">워크스페이스로 돌아가기</a></main></body>
</html>`
})
