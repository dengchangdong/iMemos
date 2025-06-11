import { html } from 'hono/html'
import { CONFIG } from './config.js'
import { utils } from './utils.js'
import { simpleMarkdown } from './markdown.js'

// 通用UI组件
const UI = {
  // 通用文章容器
  articleContainer: (header, content) => utils.createHtml`
    <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
      <header>${header}</header>
      <section class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
        ${content}
      </section>
    </article>
  `,
  
  // 通用时间标题
  timeHeader: (text) => utils.createHtml`
    <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">${text}</time>
  `,
  
  // 通用链接样式
  link: (href, text) => utils.createHtml`
    <a href="${href}" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">${text}</a>
  `
};

// 优化HTML模板渲染 - 减少重复代码
export const htmlTemplates = {
  // 错误页面模板
  errorPage(error) {
    const header = UI.timeHeader('错误');
    const content = utils.createHtml`
      <p class="text-red-600 dark:text-red-400 font-medium">加载失败</p>
      <p class="text-sm">${error.message}</p>
      <p class="mt-4">${UI.link('/', '返回首页')}</p>
    `;
    
    return UI.articleContainer(header, content);
  },
  
  // 404页面模板
  notFoundPage() {
    const header = UI.timeHeader('404');
    const content = utils.createHtml`
      <h2 class="font-medium">未找到内容</h2>
      <p>您访问的内容不存在或已被删除</p>
      <p class="mt-4">${UI.link('/', '返回首页')}</p>
    `;
    
    return UI.articleContainer(header, content);
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
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
            color: #333;
            background-color: #f9fafb;
          }
          .container {
            max-width: 500px;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 16px;
            color: #1f2937;
          }
          p {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
            color: #4b5563;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 24px;
            color: #6b7280;
          }
          .btn {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #2563eb;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #111827;
              color: #e5e7eb;
            }
            h1 {
              color: #f9fafb;
            }
            p {
              color: #d1d5db;
            }
            .icon {
              color: #9ca3af;
            }
          }
        </style>
      </head>
      <body>
        <main class="container">
          <figure class="icon" role="img" aria-label="离线状态">📶</figure>
          <h1>您当前处于离线状态</h1>
          <p>无法加载新内容。请检查您的网络连接并重试。</p>
          <a href="/" class="btn">刷新页面</a>
        </main>
      </body>
      </html>
    `
  },
  
  // 离线图片占位符 - 返回Base64编码的透明像素
  offlineImage() {
    // 提供简单的Base64编码的1x1像素透明PNG作为占位符
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  }
}

// 解析导航链接
export function parseNavLinks(linksStr) {
  if (!linksStr) return []
  
  try {
    // 将单引号替换为双引号，以符合 JSON 格式
    const jsonStr = linksStr.replace(/'/g, '"')
    const linksObj = JSON.parse(jsonStr)
    return Object.entries(linksObj).map(([text, url]) => ({ text, url }))
  } catch (error) {
    console.error('解析导航链接失败:', error)
    return []
  }
}

// 创建图片资源HTML
function createImageHTML(resource, size = '') {
  return utils.createHtml`
    <div class="${size} relative bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden ${size ? '' : 'aspect-square'} image-container">
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
}

// 渲染资源（图片）
function renderResources(resources) {
  if (!resources || resources.length === 0) return '';
  
  // 图片布局配置
  const layouts = {
    1: { containerClass: 'mt-4', itemClass: 'w-full aspect-video' },
    2: { containerClass: 'mt-4 flex flex-wrap gap-1', itemClass: 'w-[calc(50%-2px)] aspect-square' },
    default: { containerClass: 'mt-4 flex flex-wrap gap-1', itemClass: 'w-[calc(33.333%-2px)] aspect-square' }
  };
  
  // 选择布局
  const layout = layouts[resources.length] || layouts.default;
  
  // 单张图片特殊处理
  if (resources.length === 1) {
    return utils.createHtml`
      <figure class="${layout.containerClass}">
        ${createImageHTML(resources[0], layout.itemClass)}
      </figure>
    `;
  }
  
  // 多张图片通用处理
  return utils.createHtml`
    <figure class="mt-4">
      <div class="${layout.containerClass}">
        ${resources.map(resource => createImageHTML(resource, layout.itemClass)).join('')}
      </div>
    </figure>
  `;
}

// 渲染单个 memo
export function renderMemo(memo, isHomePage = false) {
  try {
    const timestamp = memo.createTime 
      ? new Date(memo.createTime).getTime()
      : memo.createdTs * 1000;
    
    // 使用utils中的时间格式化函数
    const formattedTime = utils.formatTime(timestamp);
    
    // 使用简易Markdown渲染内容
    const content = memo.content || '';
    const parsedContent = simpleMarkdown(content);
    
    // 资源处理 - 图片预览优化
    const resources = memo.resources || memo.resourceList || [];
    const resourcesHtml = renderResources(resources);
    
    // 生成memo HTML
    const header = UI.timeHeader(formattedTime);
    const memoContent = utils.createHtml`
      ${parsedContent}
      ${resourcesHtml}
    `;
    
    return utils.createHtml`
      <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
        <header>${header}</header>
        <section class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
          ${memoContent}
        </section>
        <a href="/post/${memo.id}" class="absolute -left-3 top-0 bg-white dark:bg-gray-900 rounded-full w-6 h-6 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors">
          <i class="ri-link text-indigo-500 dark:text-indigo-400 text-sm"></i>
        </a>
      </article>
    `;
  } catch (error) {
    console.error('渲染 memo 失败:', error);
    return htmlTemplates.errorPage({ message: '渲染 memo 失败' });
  }
}

// 渲染分页控件
function renderPagination(currentPage, hasMore, isHomePage, tag = '') {
  // 构建分页链接
  const buildPageLink = (page, isTag = false) => {
    if (page === null) return '';
    
    if (isTag) {
      return page === 1 ? `/tag/${tag}` : `/tag/${tag}?page=${page}`;
    }
    
    return page === 1 ? '/' : `/page/${page}`;
  };
  
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = hasMore ? currentPage + 1 : null;
  
  // 构建链接
  const prevLink = prevPage !== null ? buildPageLink(prevPage, !!tag) : '';
  const nextLink = nextPage !== null ? buildPageLink(nextPage, !!tag) : '';
  
  // 生成分页HTML
  return utils.createHtml`
    <div class="flex justify-between items-center mt-8 mb-4 px-4">
      ${prevLink ? 
        `<a href="${prevLink}" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center">
          <i class="ri-arrow-left-line mr-1"></i> 上一页
        </a>` : 
        '<span class="text-gray-400 dark:text-gray-600">上一页</span>'
      }
      
      <span class="text-gray-500 dark:text-gray-400">第 ${currentPage} 页</span>
      
      ${nextLink ? 
        `<a href="${nextLink}" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center">
          下一页 <i class="ri-arrow-right-line ml-1"></i>
        </a>` : 
        '<span class="text-gray-400 dark:text-gray-600">下一页</span>'
      }
    </div>
  `;
}

// 渲染基础HTML
export function renderBaseHtml(title, content, navLinksStr, siteName, currentPage = 1, hasMore = false, isHomePage = false, tag = '') {
  // 解析导航链接
  const navLinks = parseNavLinks(navLinksStr);
  
  // 生成导航链接HTML
  const navLinksHtml = navLinks.length > 0 
    ? navLinks.map(link => `<a href="${link.url}" class="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">${link.text}</a>`).join('')
    : '';
  
  // 生成分页HTML
  const paginationHtml = (currentPage && hasMore !== undefined) 
    ? renderPagination(currentPage, hasMore, isHomePage, tag) 
    : '';
  
  // 标签页标题
  const tagTitle = tag ? `<h1 class="text-xl font-medium mb-6 text-center">#${tag}</h1>` : '';
  
  // 组合内容
  const combinedContent = Array.isArray(content) ? content.join('') : content;
  
  // 生成完整HTML
  return utils.createHtml`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="${siteName || '个人博客'} - 记录生活点滴">
      <meta name="theme-color" content="#209cff">
      <title>${title}</title>
      <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/viewerjs@1.11.3/dist/viewer.min.css">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
        
        :root {
          --primary-color: #4f46e5;
          --primary-hover: #4338ca;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background-color: #f9fafb;
          color: #1f2937;
          line-height: 1.6;
        }
        
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #111827;
            color: #f3f4f6;
          }
        }
        
        .container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem;
        }
        
        header {
          padding: 1.5rem 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        @media (prefers-color-scheme: dark) {
          header {
            border-color: #374151;
          }
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .logo {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          text-decoration: none;
          font-family: 'Poppins', sans-serif;
        }
        
        @media (prefers-color-scheme: dark) {
          .logo {
            color: #f9fafb;
          }
        }
        
        .nav {
          display: flex;
          gap: 1rem;
        }
        
        main {
          padding: 2rem 0;
        }
        
        .article-content a {
          color: #4f46e5;
          text-decoration: none;
        }
        
        @media (prefers-color-scheme: dark) {
          .article-content a {
            color: #818cf8;
          }
        }
        
        .article-content a:hover {
          text-decoration: underline;
        }
        
        .article-content pre {
          overflow-x: auto;
        }
        
        .article-content img {
          max-width: 100%;
          height: auto;
          cursor: zoom-in;
        }
        
        footer {
          padding: 2rem 0;
          text-align: center;
          font-size: 0.875rem;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        
        @media (prefers-color-scheme: dark) {
          footer {
            color: #9ca3af;
            border-color: #374151;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <div class="header-content">
            <a href="/" class="logo">${siteName || '博客'}</a>
            <nav class="nav">
              ${navLinksHtml}
            </nav>
          </div>
        </header>
        
        <main>
          ${tagTitle}
          ${combinedContent}
          ${paginationHtml}
        </main>
        
        <footer>
          <p>&copy; ${new Date().getFullYear()} ${siteName || '博客'} | 由 <a href="https://workers.cloudflare.com/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300" target="_blank" rel="noopener noreferrer">Cloudflare Workers</a> 驱动</p>
        </footer>
      </div>
      
      <script src="https://cdn.jsdelivr.net/npm/viewerjs@1.11.3/dist/viewer.min.js"></script>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          // 初始化图片查看器
          const images = document.querySelectorAll('img[data-preview="true"]');
          if (images.length > 0) {
            images.forEach(img => {
              img.addEventListener('click', function() {
                const viewer = new Viewer(img, {
                  inline: false,
                  navbar: false,
                  title: false,
                  toolbar: {
                    zoomIn: true,
                    zoomOut: true,
                    oneToOne: true,
                    reset: true,
                    prev: false,
                    play: false,
                    next: false,
                    rotateLeft: true,
                    rotateRight: true,
                    flipHorizontal: true,
                    flipVertical: true,
                  }
                });
                viewer.show();
              });
            });
          }
        });
      </script>
    </body>
    </html>
  `;
} 
