import { html } from 'hono/html'
import { CONFIG } from './config.js'
import { utils } from './utils.js'
import { simpleMarkdown } from './markdown.js'

// HTML 模板集合
export const htmlTemplates = {
  // 错误页面模板
  errorPage(error) {
    return createArticleStructure(
      utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>`,
      utils.createHtml`
        <p class="text-red-600 dark:text-red-400 font-medium">加载失败</p>
        <p class="text-sm">${error.message}</p>
        <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
      `
    );
  },
  
  // 404 页面模板
  notFoundPage() {
    return createArticleStructure(
      utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">404</time>`,
      utils.createHtml`
        <h2 class="font-medium">未找到内容</h2>
        <p>您访问的内容不存在或已被删除</p>
        <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
      `
    );
  },
  
  // 离线页面模板
  offlinePage(siteName) {
    return utils.createHtml`
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
          <a href="/" class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">刷新页面</a>
        </main>
      </body>
      </html>
    `
  },
  
  // 离线图片占位符
  offlineImage() {
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  }
}

// 解析导航链接
export function parseNavLinks(linksStr) {
  if (!linksStr) return []
  try {
    const jsonStr = linksStr.replace(/'/g, '"')
    const linksObj = JSON.parse(jsonStr)
    return Object.entries(linksObj).map(([text, url]) => ({ text, url }))
  } catch (error) {
    console.error('解析导航链接失败:', error)
    return []
  }
}

// 创建文章结构
function createArticleStructure(header, content) {
  return utils.createHtml`
    <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
      <header>${header}</header>
      <section class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
        ${content}
      </section>
    </article>
  `;
}

// 渲染单个 memo
export function renderMemo(memo, isHomePage = false) {
  try {
    const timestamp = memo.createTime 
      ? new Date(memo.createTime).getTime()
      : memo.createdTs * 1000
    
    const formattedTime = utils.formatTime(timestamp)
    const content = memo.content || ''
    const parsedContent = simpleMarkdown(content)
    const resources = memo.resources || memo.resourceList || []
    
    // 创建图片资源HTML
    const resourcesHtml = resources.length > 0 ? createResourcesHtml(resources) : ''
    
    // 文章URL
    const articleUrl = isHomePage ? `/post/${memo.name}` : '#'
    
    // 创建文章头部
    const header = utils.createHtml`
      <a href="${articleUrl}" class="block">
        <time datetime="${new Date(timestamp).toISOString()}" class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">${formattedTime}</time>
      </a>
    `;
    
    // 创建文章内容
    const articleContent = utils.createHtml`
      ${parsedContent}
      ${resourcesHtml}
    `;
    
    return createArticleStructure(header, articleContent);
  } catch (error) {
    console.error('渲染 memo 失败:', error)
    return createArticleStructure(
      utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>`,
      utils.createHtml`<p class="text-red-500 dark:text-red-400">渲染失败: ${error.message}</p>`
    );
  }
}

// 创建资源 HTML
function createResourcesHtml(resources) {
  const createImageHtml = (resource) => utils.createHtml`
    <div class="aspect-square relative bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden">
      <img 
        src="${resource.externalLink || ''}" 
        alt="${resource.filename || '图片'}"
        class="rounded-lg w-full h-full object-cover hover:opacity-95 transition-opacity absolute inset-0 z-10"
        loading="lazy"
        data-preview="true"
      />
      <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 opacity-100 transition-opacity duration-300 image-placeholder">
        <i class="ri-image-line text-2xl"></i>
      </div>
    </div>
  `;
  
  if (resources.length === 1) {
    return utils.createHtml`
      <figure class="mt-4">
        <div class="w-full aspect-video relative bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden">
          <img 
            src="${resources[0].externalLink || ''}" 
            alt="${resources[0].filename || '图片'}"
            class="rounded-lg w-full h-full object-cover hover:opacity-95 transition-opacity absolute inset-0 z-10"
            loading="lazy"
            data-preview="true"
          />
          <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 opacity-100 transition-opacity duration-300 image-placeholder">
            <i class="ri-image-line text-3xl"></i>
          </div>
        </div>
      </figure>
    `;
  }
  
  if (resources.length === 2) {
    return utils.createHtml`
      <figure class="mt-4">
        <div class="flex flex-wrap gap-1">
          ${resources.map(createImageHtml).join('')}
        </div>
      </figure>
    `;
  }
  
  return utils.createHtml`
    <figure class="mt-4">
      <div class="grid grid-cols-3 gap-1">
        ${resources.map(createImageHtml).join('')}
      </div>
    </figure>
  `;
}

// 渲染基础 HTML
export function renderBaseHtml(title, content, navLinks, siteName, currentPage = 1, hasMore = false, isHomePage = false, tag = '') {
  const navItems = parseNavLinks(navLinks)
  const navItemsHtml = navItems.length > 0 
    ? navItems.map(item => utils.createHtml`
        <li><a href="${item.url}" class="px-3 py-1.5 rounded-md transition-colors hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-sm font-medium text-blue-500 hover:text-blue-700">${item.text}</a></li>
      `).join('')
    : '';

  const articlesHtml = Array.isArray(content) ? content.join('') : content;
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return utils.createHtml`
    <!DOCTYPE html>
    <html lang="zh-CN" class="scroll-smooth">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="${siteName} - 博客">
        <meta name="theme-color" content="#209cff">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="${currentUrl}">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${siteName} - 博客">
        <meta property="og:image" content="${origin}/og-image.jpg">
        
        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="${currentUrl}">
        <meta property="twitter:title" content="${title}">
        <meta property="twitter:description" content="${siteName} - 博客">
        <meta property="twitter:image" content="${origin}/og-image.jpg">
        
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500&family=Roboto&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                backgroundImage: {
                  'custom-gradient': 'linear-gradient(45deg, #209cff, #68e0cf)',
                  'custom-gradient-dark': 'linear-gradient(45deg, #0f4c81, #2c7873)',
                },
                colors: {
                  'indigo-timeline': '#4e5ed3',
                  'indigo-shadow': '#bab5f8',
                },
              }
            }
          }
        </script>
        <style>
          .image-placeholder {
            opacity: 0;
            transition: opacity 0.3s;
          }
          img[data-preview="true"]:hover + .image-placeholder {
            opacity: 1;
          }
        </style>
      </head>
      <body class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <nav class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" class="text-xl font-semibold text-blue-600 dark:text-blue-400">${siteName}</a>
            <ul class="flex items-center space-x-1">
              ${navItemsHtml}
            </ul>
          </nav>
        </header>
        
        <main class="max-w-4xl mx-auto px-4 py-8">
          <div class="space-y-8">
            ${articlesHtml}
          </div>
          
          ${hasMore ? utils.createHtml`
            <div class="mt-8 text-center">
              <a href="${isHomePage ? `/page/${currentPage + 1}` : `/tag/${tag}?page=${currentPage + 1}`}" 
                class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
                加载更多
              </a>
            </div>
          ` : ''}
        </main>
        
        <footer class="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
        </footer>
        
        <script>
          // 检测系统主题
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
          }
          
          // 监听主题变化
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (e.matches) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          });
        </script>
      </body>
    </html>
  `;
} 