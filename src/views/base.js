export function renderBaseHtml(title, content, footerText, navLinks, siteName) {
  // 这里只保留最简洁的基础结构，样式和脚本可按需扩展
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
        <header class="mb-12">
          <h1 class="text-2xl font-bold tracking-tight">
            <a href="/" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              ${siteName}
            </a>
          </h1>
        </header>
        <main class="flex-grow">
          ${content}
        </main>
        <footer class="mt-12">
          <div class="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>${footerText}</p>
          </div>
        </footer>
      </body>
    </html>
  `;
} 