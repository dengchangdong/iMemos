import { html } from 'hono/html'

// 解析导航链接
export function parseNavLinks(linksStr) {
  return linksStr.split(',').map(link => {
    const [name, url] = link.split(':')
    return { name, url }
  })
}

// 渲染页头
export function renderHeader(siteName, navLinks) {
  return `
    <header class="border-b border-zinc-200 dark:border-zinc-800">
      <div class="container mx-auto px-4 py-4 max-w-4xl">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <h1 class="text-2xl font-bold mb-4 md:mb-0">
            <a href="/" class="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
              ${siteName}
            </a>
          </h1>
          <nav>
            <ul class="flex space-x-6">
              ${parseNavLinks(navLinks).map(link => `
                <li>
                  <a href="${link.url}" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
                    ${link.name}
                  </a>
                </li>
              `).join('')}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  `
}

// 渲染页脚
export function renderFooter(footerText) {
  return `
    <footer class="border-t border-zinc-200 dark:border-zinc-800 mt-8">
      <div class="container mx-auto px-4 py-6 max-w-4xl">
        <div class="text-center text-zinc-600 dark:text-zinc-400">
          ${footerText}
        </div>
      </div>
    </footer>
  `
}

// 渲染图片预览模态框
export function renderImageModal() {
  return `
    <div id="imageModal" class="image-modal">
      <img id="modalImage" src="" alt="预览图片">
    </div>
  `
}

// 渲染公共样式
export function renderStyles() {
  return `
    <style>
      .image-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 1000;
        cursor: zoom-out;
      }
      .image-modal img {
        max-width: 90%;
        max-height: 90vh;
        margin: auto;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        object-fit: contain;
      }
    </style>
  `
}

// 渲染公共脚本
export function renderScripts() {
  return `
    <script>
      // 注册 Service Worker
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(registration => {
              console.log('Service Worker 注册成功:', registration.scope);
            })
            .catch(error => {
              console.error('Service Worker 注册失败:', error);
            });
        });
      }

      // 检测系统主题
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      }

      // 监听系统主题变化
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      })

      // 图片预览功能
      const imageModal = document.getElementById('imageModal')
      const modalImage = document.getElementById('modalImage')

      function showImageModal(src) {
        modalImage.src = src
        imageModal.style.display = 'block'
        document.body.style.overflow = 'hidden'
      }

      function hideImageModal() {
        imageModal.style.display = 'none'
        document.body.style.overflow = ''
      }

      imageModal.addEventListener('click', hideImageModal)
    </script>
  `
}

// 渲染单个 memo
export function renderMemo(memo) {
  return `
    <article class="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div class="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
        ${new Date(memo.createdTs * 1000).toLocaleString('zh-CN')}
      </div>
      <div class="text-lg leading-relaxed">
        ${memo.content}
      </div>
      ${memo.resourceList.length > 0 ? `
        <div class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          ${memo.resourceList.map(resource => `
            <div class="relative aspect-square overflow-hidden rounded-lg cursor-zoom-in" onclick="showImageModal('${resource.externalLink}')">
              <img 
                src="${resource.externalLink}" 
                alt="${resource.filename}"
                class="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          `).join('')}
        </div>
      ` : ''}
      <div class="mt-4 text-sm text-zinc-500">
        <a href="/post/${memo.name}" class="hover:text-zinc-700 dark:hover:text-zinc-300">
          查看详情
        </a>
      </div>
    </article>
  `
}

// 渲染基础 HTML 结构
export function renderBaseHtml(c, title, content) {
  return html`
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - ${c.env.SITE_NAME}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" rel="stylesheet">
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  zinc: {
                    50: '#fafafa',
                    100: '#f4f4f5',
                    200: '#e4e4e7',
                    300: '#d4d4d8',
                    400: '#a1a1aa',
                    500: '#71717a',
                    600: '#52525b',
                    700: '#3f3f46',
                    800: '#27272a',
                    900: '#18181b',
                    950: '#09090b',
                  }
                }
              }
            }
          }
        </script>
        ${renderStyles()}
      </head>
      <body class="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen flex flex-col">
        <header class="border-b border-zinc-200 dark:border-zinc-800">
          <div class="container mx-auto px-4 py-4 max-w-4xl">
            <div class="flex flex-col md:flex-row justify-between items-center">
              <h1 class="text-2xl font-bold mb-4 md:mb-0">
                <a href="/" class="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
                  ${c.env.SITE_NAME}
                </a>
              </h1>
            </div>
          </div>
        </header>
        
        <main class="flex-grow">
          ${content}
        </main>

        <footer class="border-t border-zinc-200 dark:border-zinc-800 mt-8">
          <div class="container mx-auto px-4 py-6 max-w-4xl">
            <div class="text-center text-zinc-600 dark:text-zinc-400">
              © 2024 Memos Themes. All rights reserved.
            </div>
          </div>
        </footer>
        ${renderImageModal()}
        ${renderScripts()}
      </body>
    </html>
  `
}