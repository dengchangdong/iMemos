import { html } from 'hono/html'
import { parseNavLinks } from '../utils/templateUtils.js'

export function BaseLayout({ 
  title, 
  content, 
  navLinks, 
  siteName, 
  currentPage = 1, 
  hasMore = false, 
  isHomePage = false, 
  tag = '' 
}) {
  const navItems = parseNavLinks(navLinks)
  const navItemsHtml = navItems.length > 0 
    ? navItems.map(item => html`
        <li>
          <a 
            href="${item.url}" 
            class="px-3 py-1.5 rounded-md transition-colors hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-sm font-medium text-blue-500 hover:text-blue-700"
          >
            ${item.text}
          </a>
        </li>
      `).join('')
    : ''

  return html`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="${siteName || '博客'} - ${title || '首页'}">
      <meta name="theme-color" content="#209cff">
      <title>${title ? `${title} - ` : ''}${siteName || '博客'}</title>
      <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        // 检测系统主题
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      </script>
    </head>
    <body class="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <header class="sticky top-0 z-50 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <a href="/" class="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              ${siteName || '博客'}
            </a>
            <nav>
              <ul class="flex space-x-1">
                ${navItemsHtml}
                <li>
                  <button 
                    id="theme-toggle"
                    class="p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    aria-label="切换主题"
                  >
                    <i class="ri-sun-line dark:hidden"></i>
                    <i class="ri-moon-line hidden dark:block"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        ${content}
        
        ${hasMore ? html`
          <div class="mt-8 text-center">
            <a 
              href="/page/${currentPage + 1}${tag ? `?tag=${tag}` : ''}" 
              class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              加载更多
            </a>
          </div>
        ` : ''}
      </main>

      <footer class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© ${new Date().getFullYear()} ${siteName || '博客'}. All rights reserved.</p>
      </footer>

      <script>
        // 主题切换
        const themeToggle = document.getElementById('theme-toggle')
        themeToggle.addEventListener('click', () => {
          if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark')
            localStorage.theme = 'light'
          } else {
            document.documentElement.classList.add('dark')
            localStorage.theme = 'dark'
          }
        })

        // 图片加载优化
        document.addEventListener('DOMContentLoaded', () => {
          const images = document.querySelectorAll('img[data-preview="true"]')
          images.forEach(img => {
            img.addEventListener('load', () => {
              const placeholder = img.parentElement.querySelector('.image-placeholder')
              if (placeholder) {
                placeholder.style.opacity = '0'
                setTimeout(() => placeholder.remove(), 300)
              }
            })
          })
        })
      </script>
    </body>
    </html>
  `
} 