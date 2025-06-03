import { html } from 'hono/html'
import utils from './utils.js';
import CONFIG from './config.js';
import { simpleMarkdown } from './markdown.js';

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
export function renderMemo(memo, isHomePage = false) {
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

// 错误页面模板
const htmlTemplates = {
  // ... 直接粘贴 index.js 里的 htmlTemplates ...
};

// 渲染基础 HTML
export function renderBaseHtml(title, content, footerText, navLinks, siteName) {
  // ... 直接粘贴 index.js 里的 renderBaseHtml 实现 ...
}

export { renderMemo, htmlTemplates, renderBaseHtml }; 