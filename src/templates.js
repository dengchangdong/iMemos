import { html } from 'hono/html'
import { CONFIG } from './config.js'
import { utils, markdownRenderer } from './utils.js'

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
      // 图片预览功能
      document.addEventListener('DOMContentLoaded', () => {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        
        // 为所有可预览图片添加点击事件
        document.querySelectorAll('img[data-preview="true"]').forEach(img => {
          img.style.cursor = 'zoom-in';
          img.addEventListener('click', () => {
            modal.style.display = 'block';
            modalImg.src = img.src;
          });
        });
        
        // 点击模态框关闭预览
        modal.addEventListener('click', () => {
          modal.style.display = 'none';
        });
      });
      
      // 暗色模式切换
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    </script>
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
        ${renderHeader(c.env.SITE_NAME, c.env.NAV_LINKS || '')}
        
        <main class="flex-grow">
          ${content}
        </main>

        <footer class="border-t border-zinc-200 dark:border-zinc-800 mt-8">
          <div class="container mx-auto px-4 py-6 max-w-4xl">
            <div class="text-center text-zinc-600 dark:text-zinc-400">
              ${CONFIG.FOOTER_TEXT}
            </div>
          </div>
        </footer>
        ${renderImageModal()}
        ${renderScripts()}
      </body>
    </html>
  `
}

// 渲染错误页面
export function renderErrorPage(error) {
  return utils.createHtml`
    <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg">
      <h2 class="text-lg font-semibold mb-2">加载失败</h2>
      <p class="text-sm">${error.message}</p>
      <a href="/" class="inline-flex items-center mt-4 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
        <i class="ti ti-arrow-left mr-1"></i>
        返回首页
      </a>
    </div>
  `
}

// 渲染404页面
export function renderNotFoundPage() {
  return utils.createHtml`
    <div class="text-center py-12">
      <i class="ti ti-alert-circle text-5xl text-gray-400 mb-4"></i>
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">未找到内容</h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6">您访问的内容不存在或已被删除</p>
      <a href="/" class="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
        <i class="ti ti-arrow-left mr-1"></i>
        返回首页
      </a>
    </div>
  `
}

// 渲染Memo卡片
export function renderMemo(memo, isHomePage = false) {
  const content = markdownRenderer.render(memo.content)
  const time = utils.formatTime(memo.createdTs * 1000)
  
  return utils.createHtml`
    <article class="${CONFIG.CSS.CARD} p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <time class="text-sm text-gray-500 dark:text-gray-400">${time}</time>
        ${!isHomePage ? `
          <a href="/memo/${memo.id}" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <i class="ti ti-link"></i>
          </a>
        ` : ''}
      </div>
      <div class="${CONFIG.CSS.PROSE}">
        ${content}
      </div>
      ${memo.resourceList && memo.resourceList.length > 0 ? `
        <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          ${memo.resourceList.map(resource => `
            <div class="relative aspect-square">
              <img 
                src="${resource.externalLink || resource.publicUrl}" 
                alt="${resource.filename}"
                class="w-full h-full object-cover rounded-lg cursor-zoom-in"
                data-preview="true"
                loading="lazy"
              />
            </div>
          `).join('')}
        </div>
      ` : ''}
    </article>
  `
} 