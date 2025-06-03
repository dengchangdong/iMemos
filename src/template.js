import { html } from 'hono/html'
import { CONFIG } from './config.js';
import { formatTime, createHtml } from './utils.js';
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
  try {
    const timestamp = memo.createTime
      ? new Date(memo.createTime).getTime()
      : memo.createdTs * 1000;
    const date = formatTime(timestamp);
    const content = memo.content || '';
    const parsedContent = simpleMarkdown(content);
    const resources = memo.resources || memo.resourceList || [];
    let resourcesHtml = '';
    if (resources.length > 0) {
      const gridCols = resources.length === 1 ? 'grid-cols-1' :
                      resources.length === 2 ? 'grid-cols-2' :
                      'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      resourcesHtml = createHtml`
        <div class="grid ${gridCols} gap-4 mt-6">
          ${resources.map(resource => createHtml`
            <div class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer" onclick="showImage(this.querySelector('img'))">
              <img 
                src="${resource.externalLink || ''}" 
                alt="${resource.filename || '图片'}"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
                loading="lazy"
                data-preview="true"
              />
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 rounded-lg"></div>
            </div>
          `).join('')}
        </div>
      `;
    }
    const timeHtml = isHomePage
      ? createHtml`<time class="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
           <a href="/post/${memo.name}" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
             ${date}
           </a>
         </time>`
      : createHtml`<time class="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">${date}</time>`;
    return createHtml`
      <article class="${CONFIG.CSS.CARD}">
        <div class="p-6 sm:p-8">
          ${timeHtml}
          <div class="mt-4 ${CONFIG.CSS.PROSE}">
            ${parsedContent}
          </div>
          ${resourcesHtml}
        </div>
      </article>
    `;
  } catch (error) {
    return createHtml`
      <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        <p class="font-medium">渲染失败</p>
        <p class="text-sm mt-1">${error.message}</p>
      </div>
    `;
  }
}

export const htmlTemplates = {
  errorPage(error) {
    return createHtml`
      <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">加载失败</h2>
        <p class="text-sm">${error.message}</p>
        <a href="/" class="inline-flex items-center mt-4 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
          <i class="ti ti-arrow-left mr-1"></i>
          返回首页
        </a>
      </div>
    `;
  },
  notFoundPage() {
    return createHtml`
      <div class="text-center py-12">
        <i class="ti ti-alert-circle text-5xl text-gray-400 mb-4"></i>
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">未找到内容</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">您访问的内容不存在或已被删除</p>
        <a href="/" class="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          <i class="ti ti-arrow-left mr-1"></i>
          返回首页
        </a>
      </div>
    `;
  }
};

export function renderBaseHtml(title, content, footerText, navLinks, siteName) {
  // 省略，直接从 index.js 拷贝完整实现
  // ...
}

export function renderErrorPage(error, c) {
  return renderBaseHtml(
    '错误',
    htmlTemplates.errorPage(error),
    c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  );
} 