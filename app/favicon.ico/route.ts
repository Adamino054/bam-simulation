const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><linearGradient id="cbs" x1="8" y1="6" x2="56" y2="58"><stop stop-color="#c41923"/><stop offset="1" stop-color="#7f1018"/></linearGradient></defs>
  <rect width="64" height="64" rx="16" fill="url(#cbs)"/>
  <path d="M15 27 32 16l17 11v3H15v-3Zm4 7h5v12h-5V34Zm10 0h6v12h-6V34Zm11 0h5v12h-5V34ZM14 49h36v4H14v-4Z" fill="#f4dfaa"/>
  <circle cx="32" cy="25" r="3" fill="#fff7df"/>
</svg>`

export function GET() {
  return new Response(favicon, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  })
}
