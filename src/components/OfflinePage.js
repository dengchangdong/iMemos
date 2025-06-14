import { html } from 'hono/html'

export function OfflinePage(siteName) {
  return html`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="离线状态页面">
      <meta name="theme-color" content="#209cff">
      <title>离线 - ${siteName || '博客'}</title>
      <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-5">
      <main class="max-w-md w-full text-center">
        <figure class="text-5xl mb-6" role="img" aria-label="离线状态">📶</figure>
        <h1 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">您当前处于离线状态</h1>
        <p class="text-gray-600 dark:text-gray-300 mb-6">无法加载新内容。请检查您的网络连接并重试。</p>
        <a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
          刷新页面
        </a>
      </main>
    </body>
    </html>
  `
} 