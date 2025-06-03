export default function offlineRoute(c) {
  return new Response(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>离线 - ${c.env.SITE_NAME || '博客'}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; padding: 20px; text-align: center; color: #333; background-color: #f9fafb; }
        .container { max-width: 500px; }
        h1 { font-size: 24px; margin-bottom: 16px; color: #1f2937; }
        p { font-size: 16px; line-height: 1.6; margin-bottom: 24px; color: #4b5563; }
        .icon { font-size: 48px; margin-bottom: 24px; color: #6b7280; }
        .btn { display: inline-block; background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; transition: background-color 0.2s; }
        .btn:hover { background-color: #2563eb; }
        @media (prefers-color-scheme: dark) { body { background-color: #111827; color: #e5e7eb; } h1 { color: #f9fafb; } p { color: #d1d5db; } .icon { color: #9ca3af; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📶</div>
        <h1>您当前处于离线状态</h1>
        <p>无法加载新内容。请检查您的网络连接并重试。</p>
        <a href="/" class="btn">刷新页面</a>
      </div>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=2592000'
    }
  });
} 