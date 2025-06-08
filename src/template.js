import { html } from 'hono/html'
import { CONFIG } from './config.js'
import { utils } from './utils.js'
import { simpleMarkdown } from './markdown.js'

// 优化HTML模板渲染 - 减少重复代码
export const htmlTemplates = {
  // 错误页面模板
  errorPage(error) {
    return utils.createHtml`
      <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
        <header>
        <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>
        </header>
        <section class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
          <p class="text-red-600 dark:text-red-400 font-medium">加载失败</p>
        <p class="text-sm">${error.message}</p>
          <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
        </section>
      </article>
    `
  },
  
  // 404页面模板
  notFoundPage() {
    return utils.createHtml`
      <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
        <header>
        <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">404</time>
        </header>
        <section class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
          <h2 class="font-medium">未找到内容</h2>
          <p>您访问的内容不存在或已被删除</p>
          <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
        </section>
      </article>
    `
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

// 渲染单个 memo
export function renderMemo(memo, isHomePage = false) {
  try {
    const timestamp = memo.createTime 
      ? new Date(memo.createTime).getTime()
      : memo.createdTs * 1000
    
    // 使用utils中的时间格式化函数
    const formattedTime = utils.formatTime(timestamp)
    
    // 使用简易Markdown渲染内容
    const content = memo.content || ''
    const parsedContent = simpleMarkdown(content)
    
    // 资源处理 - 图片预览优化
    const resources = memo.resources || memo.resourceList || []
    let resourcesHtml = ''
    
    // 创建图片资源HTML
    if (resources.length > 0) {
      // 创建单个图片HTML的函数
      const createImageHTML = (resource, size = '') => utils.createHtml`
        <div class="${size} relative bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden ${size ? '' : 'aspect-square'} image-container">
          <img 
            src="${resource.externalLink || ''}" 
            alt="${resource.filename || '图片'}"
            class="rounded-lg w-full h-full object-cover hover:opacity-95 transition-opacity absolute inset-0 z-10"
            loading="lazy"
            data-preview="true"
            onload="this.classList.add('loaded'); this.parentNode.classList.add('loaded')"
          />
          <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 opacity-100 transition-opacity duration-300 image-placeholder">
            <span class="${resources.length > 2 ? 'text-2xl' : 'text-3xl'} icon-image" aria-hidden="true"></span>
          </div>
        </div>
      `;

      // 根据图片数量决定布局
      if (resources.length === 1) {
        // 单张图片 - 100%宽度
        resourcesHtml = utils.createHtml`
          <figure class="mt-4">
            ${createImageHTML(resources[0], 'w-full aspect-video')}
          </figure>
        `;
      } else if (resources.length === 2) {
        // 两张图片 - 各50%宽度
        resourcesHtml = utils.createHtml`
          <figure class="mt-4">
            <div class="flex flex-wrap gap-1">
              ${resources.map(resource => createImageHTML(resource, 'w-[calc(50%-2px)] aspect-square')).join('')}
            </div>
          </figure>
        `;
      } else {
        // 三张或更多图片 - 九宫格布局
        resourcesHtml = utils.createHtml`
          <figure class="mt-4">
            <div class="grid grid-cols-3 gap-1">
              ${resources.map(resource => createImageHTML(resource)).join('')}
            </div>
          </figure>
        `;
      }
    }
    
    // 文章URL
    const articleUrl = isHomePage ? `/post/${memo.name}` : '#'
    
    // 使用时间轴样式渲染
    return utils.createHtml`
      <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
        <header>
          <a href="${articleUrl}" class="block">
            <time datetime="${new Date(timestamp).toISOString()}" class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">${formattedTime}</time>
          </a>
        </header>
        <section class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
          ${parsedContent}
          ${resourcesHtml}
        </section>
      </article>
    `
  } catch (error) {
    console.error('渲染 memo 失败:', error)
    return utils.createHtml`
      <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
        <header>
          <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>
        </header>
        <section class="text-red-500 dark:text-red-400 leading-relaxed mt-1 md:text-base text-sm">
          <p>渲染失败: ${error.message}</p>
        </section>
      </article>
    `
  }
}

// 渲染基础 HTML - 使用index.html作为模板
export function renderBaseHtml(title, content, footerText, navLinks, siteName) {
  // 解析导航链接
  const navItems = parseNavLinks(navLinks)

  // 导航链接HTML
  const navItemsHtml = navItems.length > 0 
    ? navItems.map(item => utils.createHtml`
        <li><a href="${item.url}" class="nav-link">${item.text}</a></li>
      `).join('')
    : '';
  
  // 创建文章HTML - 针对首页模式下的多条memo
  let articlesHtml = '';
  if (Array.isArray(content)) {
    articlesHtml = content.join('');
  } else {
    articlesHtml = content;
  }

  // 返回基于index.html模板的HTML
  return utils.createHtml`
    <!DOCTYPE html>
    <html lang="zh-CN" class="scroll-smooth">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="${siteName} - 博客">
        <meta name="theme-color" content="#209cff">
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500&family=Roboto&display=swap" rel="stylesheet">
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
        <style type="text/tailwindcss">
          @layer utilities {
            article::before {
              @apply content-[''] w-[17px] h-[17px] bg-white border border-indigo-timeline rounded-full absolute -left-[10px] top-0;
              box-shadow: 3px 3px 0px #bab5f8;
              will-change: transform;
            }
            .dark article::before {
              @apply bg-gray-800 border-indigo-400;
              box-shadow: 3px 3px 0px #6366f1;
            }
            article:last-child {
              @apply border-transparent;
            }
            .nav-link {
              @apply px-3 py-1.5 rounded-md transition-colors hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-sm font-medium;
              color: #209cff;
            }
            .dark .nav-link {
              color: #68e0cf;
            }
            .nav-link:hover {
              color: #0c7cd5;
            }
            .dark .nav-link:hover {
              color: #8eeee0;
            }
            .article-content p {
              line-height: 1.5;
              margin-top: 5px;
              margin-bottom: 15px;
            }
            .container {
              @apply w-full mx-auto;
              max-width: 640px;
            }
            
            @media (max-width: 640px) {
              .header-container {
                @apply flex-col items-start;
              }
              .header-container h1 {
                @apply mb-4;
              }
              .header-right {
                @apply w-full justify-between mt-2;
              }
            }
          }
        </style>
        <!-- 使用常规CSS避免循环依赖 -->
        <style>
          /* 定义图标 SVG 使用data:image/svg+xml */
          .icon-sun {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z'%3E%3C/path%3E%3C/svg%3E");
            display: inline-block;
            width: 24px;
            height: 24px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            vertical-align: middle;
          }
          
          .icon-moon {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M9.36077 3.29282C5.40972 4.96765 2.5 8.83147 2.5 13.446C2.5 19.2635 7.18652 23.95 13.004 23.95C17.6168 23.95 21.4789 21.0428 23.1544 17.0945C22.1772 17.4009 21.1448 17.5649 20.0769 17.5649C14.2594 17.5649 9.53297 12.8383 9.53297 7.02087C9.53297 5.9511 9.69711 4.91789 10.0039 3.93956C9.77109 4.05257 9.56244 4.17358 9.36077 4.29935V3.29282Z'%3E%3C/path%3E%3C/svg%3E");
            display: inline-block;
            width: 24px;
            height: 24px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            vertical-align: middle;
          }
          
          .icon-contrast {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M4.99999 12C4.99999 7.58172 8.58171 4 13 4V20C8.58171 20 4.99999 16.4183 4.99999 12Z'%3E%3C/path%3E%3Cpath d='M19 12C19 14.2091 17.2091 16 15 16C15 13.7909 16.7909 12 19 12Z'%3E%3C/path%3E%3Cpath d='M15 8C15 10.2091 13.2091 12 11 12C11 9.79086 12.7909 8 15 8Z'%3E%3C/path%3E%3C/svg%3E");
            display: inline-block;
            width: 24px;
            height: 24px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            vertical-align: middle;
          }
          
          .icon-arrow-up {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 10.828L5.63605 17.192L4.22183 15.7777L12 7.99957L19.7782 15.7777L18.3639 17.192L12 10.828Z'%3E%3C/path%3E%3C/svg%3E");
            display: inline-block;
            width: 24px;
            height: 24px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            vertical-align: middle;
          }
          
          .icon-image {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M2.9918 21C2.44405 21 2 20.5551 2 20.0082V3.9918C2 3.44405 2.44495 3 2.9918 3H21.0082C21.556 3 22 3.44495 22 3.9918V20.0082C22 20.556 21.5551 21 21.0082 21H2.9918ZM20 15V5H4V19L14 9L20 15ZM20 17.8284L14 11.8284L6.82843 19H20V17.8284ZM8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11Z'%3E%3C/path%3E%3C/svg%3E");
            display: inline-block;
            width: 24px;
            height: 24px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            vertical-align: middle;
          }
          
          .icon-close {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M12 10.5858L16.2426 6.34317L17.6568 7.75738L13.4142 12L17.6568 16.2426L16.2426 17.6568L12 13.4142L7.75736 17.6568L6.34315 16.2426L10.5858 12L6.34315 7.75738L7.75736 6.34317L12 10.5858Z'%3E%3C/path%3E%3C/svg%3E");
            display: inline-block;
            width: 24px;
            height: 24px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            vertical-align: middle;
          }
          
          .icon-arrow-left {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M10.8284 12L15.7782 16.9497L14.364 18.364L8 12L14.364 5.63604L15.7782 7.05025L10.8284 12Z'%3E%3C/path%3E%3C/svg%3E");
            display: inline-block;
            width: 24px;
            height: 24px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            vertical-align: middle;
          }
          
          .icon-arrow-right {
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'%3E%3Cpath d='M13.1716 12L8.22183 7.05025L9.63604 5.63604L16 12L9.63604 18.364L8.22183 16.9497L13.1716 12Z'%3E%3C/path%3E%3C/svg%3E");
            display: inline-block;
            width: 24px;
            height: 24px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            vertical-align: middle;
          }
          
          /* 调整图标大小 */
          .text-2xl .icon-image,
          .text-2xl.icon-image {
            width: 20px;
            height: 20px;
          }
          
          .text-3xl .icon-image,
          .text-3xl.icon-image {
            width: 28px;
            height: 28px;
          }
          
          .back-to-top {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9999px;
            background-color: #209cff;
            color: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            z-index: 50;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            transform: translateZ(0);
            will-change: opacity, transform;
          }
          
          .dark .back-to-top {
            background-color: #209cff;
            color: white;
          }
          
          .back-to-top:hover {
            background-color: #0c7cd5;
            color: white;
            transform: translateY(-2px) translateZ(0);
          }
          
          .dark .back-to-top:hover {
            background-color: #0c7cd5;
            color: white;
          }
          
          .back-to-top.visible {
            opacity: 1;
            visibility: visible;
          }
          
          /* 图片预览模态框样式 */
          .image-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            z-index: 100;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
            will-change: opacity;
          }

          .image-modal.active {
            display: flex;
            opacity: 1;
          }

          .image-modal-content {
            max-width: 90%;
            max-height: 90%;
            position: relative;
            will-change: transform;
            transform: translateZ(0);
          }

          .image-modal-content img {
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 4px;
            opacity: 0;
            transition: opacity 0.3s ease;
            will-change: opacity;
          }
          
          .image-modal-content img.loaded {
            opacity: 1;
          }
          
          /* 优化加载动画 */
          .image-loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }
          
          .spinner {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            position: relative;
            animation: rotate 1s linear infinite;
            will-change: transform;
          }
          
          .spinner::before {
            content: "";
            box-sizing: border-box;
            position: absolute;
            inset: 0px;
            border-radius: 50%;
            border: 3px solid #FFF;
            animation: prixClipFix 2s linear infinite;
          }
          
          @keyframes rotate {
            100% { transform: rotate(360deg); }
          }
          
          @keyframes prixClipFix {
            0% { clip-path: polygon(50% 50%, 0 0, 0 0, 0 0, 0 0, 0 0); }
            25% { clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 0, 100% 0, 100% 0); }
            50% { clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 100% 100%, 100% 100%); }
            75% { clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 100%); }
            100% { clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 0); }
          }

          .image-modal-close {
            position: absolute;
            top: -40px;
            right: 0;
            color: white;
            font-size: 24px;
            cursor: pointer;
            background: none;
            border: none;
            padding: 8px;
            will-change: transform;
          }

          .image-modal-prev,
          .image-modal-next {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
            will-change: transform, background-color;
          }

          .image-modal-prev:hover,
          .image-modal-next:hover {
            background: rgba(0, 0, 0, 0.7);
          }

          .image-modal-prev {
            left: 10px;
          }

          .image-modal-next {
            right: 10px;
          }

          @media (max-width: 768px) {
            .image-modal-content {
              max-width: 95%;
            }
          }
          
          /* 添加图片点击样式 */
          .article-content img, 
          .mt-4 img {
            cursor: pointer;
            transition: opacity 0.2s;
            background-color: #0c7cd51c;
            opacity: 0.5;
            will-change: opacity;
          }
          
          .article-content img.loaded, 
          .mt-4 img.loaded {
            opacity: 1;
          }
          
          .article-content img:hover, 
          .mt-4 img:hover {
            opacity: 0.9;
          }
          
          /* 图片容器加载状态样式 */
          .image-placeholder {
            opacity: 1;
            transition: opacity 0.3s ease;
            will-change: opacity;
          }
          
          div.loaded .image-placeholder {
            opacity: 0;
          }
          
          /* 图片容器样式 */
          .aspect-video {
            aspect-ratio: 16 / 9;
          }
          
          /* 多图片布局样式优化 */
          .aspect-square {
            aspect-ratio: 1 / 1;
            position: relative;
            background-color: #0c7cd51c;
            border-radius: 0.5rem;
            overflow: hidden;
          }
          
          /* 图片容器点击样式 */
          .image-container {
            cursor: pointer;
            position: relative;
            z-index: 1;
            transform: translateZ(0);
            will-change: transform;
          }
          
          .image-container img {
            z-index: 2;
            transform: translateZ(0);
          }
          
          .image-placeholder {
            z-index: 1;
          }
        </style>
      </head>
    <body class="min-h-screen bg-custom-gradient dark:bg-custom-gradient-dark bg-fixed m-0 p-0 font-sans">
      <div class="container px-4 py-12 sm:px-4 sm:py-12 px-[10px] py-[20px]">
          <section class="bg-blue-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full sm:p-8 p-[15px]">
          <header class="flex items-center justify-between sm:flex-row flex-row">
            <div class="flex items-center">
                <a href="/" class="flex items-center" aria-label="返回首页">
                <h1 class="text-xl md:text-lg font-semibold font-poppins text-gray-800 dark:text-gray-100 mb-0 tracking-wide">${siteName}</h1>
              </a>
                </div>
            <div class="flex items-center space-x-4">
                <nav class="mr-1" aria-label="网站导航">
                <ul class="flex space-x-2">
                  ${navItemsHtml}
                </ul>
              </nav>
                <button id="theme-toggle" class="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-[#209cff] dark:text-[#68e0cf] hover:text-[#0c7cd5] dark:hover:text-[#8eeee0] focus:outline-none transition-colors shadow-sm" aria-label="切换主题">
                  <span class="icon-sun" id="theme-icon" aria-hidden="true"></span>
                </button>
            </div>
          </header>
          <main class="mt-8 relative">
            ${articlesHtml}
            </main>
          </section>
        </div>

        <button id="back-to-top" class="back-to-top" aria-label="返回顶部">
          <span class="icon-arrow-up" aria-hidden="true"></span>
        </button>
      
      <!-- 图片预览模态框 -->
        <div id="imageModal" class="image-modal" aria-modal="true" aria-label="图片预览">
        <div class="image-modal-content">
            <button class="image-modal-close" aria-label="关闭预览">
              <span class="icon-close" aria-hidden="true"></span>
          </button>
            <div class="image-loading" role="status" aria-live="polite">
              <div class="spinner" aria-hidden="true"></div>
            </div>
            <figure class="w-full h-full flex items-center justify-center">
              <img id="modalImage" src="" alt="预览图片" loading="lazy" class="max-w-full max-h-[90vh] object-contain">
            </figure>
            <button class="image-modal-prev" aria-label="上一张">
              <span class="icon-arrow-left" aria-hidden="true"></span>
            </button>
            <button class="image-modal-next" aria-label="下一张">
              <span class="icon-arrow-right" aria-hidden="true"></span>
            </button>
        </div>
      </div>

        <script>
        // 使用自执行函数封装所有代码，避免污染全局作用域
        (function() {
          // 性能优化：使用变量缓存DOM元素和计算结果
          // 主题切换功能
          function initThemeToggle() {
            const themeToggle = document.getElementById('theme-toggle');
            const themeIcon = document.getElementById('theme-icon');
            const html = document.documentElement;
            
            // 主题模式
            const themes = ['system', 'light', 'dark'];
            let currentTheme = 0; // 默认跟随系统
            
            // 优化：批量更新DOM操作
            function updateIcon(theme) {
              const themeButton = document.getElementById('theme-toggle');
              if (theme === 'light') {
                // 移除之前的图标类
                themeIcon.classList.remove('icon-moon', 'icon-contrast');
                themeIcon.classList.add('icon-sun');
                themeButton.setAttribute('aria-label', '切换到深色模式');
              } else if (theme === 'dark') {
                // 移除之前的图标类
                themeIcon.classList.remove('icon-sun', 'icon-contrast');
                themeIcon.classList.add('icon-moon');
                themeButton.setAttribute('aria-label', '切换到浅色模式');
              } else {
                // 移除之前的图标类
                themeIcon.classList.remove('icon-sun', 'icon-moon');
                themeIcon.classList.add('icon-contrast');
                themeButton.setAttribute('aria-label', '切换到系统模式');
              }
            }
            
            // 应用主题 - 批量处理DOM更新
            function applyTheme(theme) {
              // 使用requestAnimationFrame确保在下一帧执行DOM更新
              requestAnimationFrame(() => {
                if (theme === 'light') {
                  html.classList.remove('dark');
                  localStorage.theme = 'light';
                } else if (theme === 'dark') {
                  html.classList.add('dark');
                  localStorage.theme = 'dark';
                } else {
                  // 跟随系统
                  localStorage.removeItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (prefersDark) {
                    html.classList.add('dark');
                  } else {
                    html.classList.remove('dark');
                  }
                }
                updateIcon(theme);
              });
            }
            
            // 优化：立即检查主题，避免闪烁
            const storedTheme = localStorage.theme;
            if (storedTheme === 'dark') {
              html.classList.add('dark');
              currentTheme = 2; // dark
              updateIcon('dark');
            } else if (storedTheme === 'light') {
              html.classList.remove('dark');
              currentTheme = 1; // light
              updateIcon('light');
            } else {
              // 跟随系统
              if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                html.classList.add('dark');
              }
              updateIcon('system');
            }
            
            // 优化：使用事件委托处理点击
            themeToggle.addEventListener('click', () => {
              currentTheme = (currentTheme + 1) % 3;
              const newTheme = themes[currentTheme];
              applyTheme(newTheme);
            });

            // 优化：使用防抖函数处理系统主题变化
            const mql = window.matchMedia('(prefers-color-scheme: dark)');
            const handleThemeChange = (e) => {
              if (!localStorage.theme) { // 只在跟随系统模式下响应
                requestAnimationFrame(() => {
                  if (e.matches) {
                    html.classList.add('dark');
                  } else {
                    html.classList.remove('dark');
                  }
                });
              }
            };
            
            mql.addEventListener('change', handleThemeChange);
          }

          // 返回顶部功能 - 使用Intersection Observer替代滚动监听
          function initBackToTop() {
            const backToTop = document.getElementById('back-to-top');
            
            // 优化：使用Intersection Observer代替滚动事件监听
            const observer = new IntersectionObserver((entries) => {
              // 当页面顶部不在视口时显示返回顶部按钮
              const shouldShow = !entries[0].isIntersecting;
              requestAnimationFrame(() => {
                if (shouldShow) {
                  backToTop.classList.add('visible');
                } else {
                  backToTop.classList.remove('visible');
                }
              });
            }, { 
              threshold: 0,
              rootMargin: '-300px 0px 0px 0px' // 当顶部300px不可见时触发
            });
            
            // 观察页面顶部元素
            const pageTop = document.createElement('div');
            pageTop.style.position = 'absolute';
            pageTop.style.top = '0';
            pageTop.style.left = '0';
            pageTop.style.width = '1px';
            pageTop.style.height = '1px';
            pageTop.style.pointerEvents = 'none';
            document.body.appendChild(pageTop);
            observer.observe(pageTop);
              
            // 优化：使用requestAnimationFrame平滑滚动
            backToTop.addEventListener('click', () => {
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
            });
          }
        
          // 图片预览功能 - 优化图片加载和事件处理
          function initImageViewer() {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            const closeBtn = modal.querySelector('.image-modal-close');
            const prevBtn = modal.querySelector('.image-modal-prev');
            const nextBtn = modal.querySelector('.image-modal-next');
            const loadingIndicator = modal.querySelector('.image-loading');
            
            // 缓存数据
            let allImages = [];
            let currentIndex = 0;
            let isModalActive = false;
            
            // 性能优化：使用IntersectionObserver实现懒加载
            const lazyLoadObserver = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  const img = entry.target;
                  const dataSrc = img.getAttribute('data-src');
                  
                  if (dataSrc) {
                    // 图片进入视口时才加载真实图片
                    img.src = dataSrc;
                    img.removeAttribute('data-src');
                  }
                  
                  // 停止观察已处理的图片
                  lazyLoadObserver.unobserve(img);
                }
              });
            }, {
              rootMargin: '200px' // 提前200px加载
            });
            
            // 获取所有可点击图片 - 性能优化：只在需要时计算
            function collectImages() {
              if (allImages.length === 0) {
                allImages = Array.from(document.querySelectorAll('[data-preview="true"]'));
              }
              return allImages;
            }
            
            // 为所有图片添加加载事件 - 性能优化：批量处理
            function setupImageLoadHandlers() {
              // 收集所有需要处理的图片
              const images = collectImages();
              
              // 批量处理以减少重绘
              requestAnimationFrame(() => {
                images.forEach((img) => {
                  // 设置懒加载
                  if (!img.dataset.src && !img.classList.contains('lazy-loaded')) {
                    const originalSrc = img.src;
                    if (originalSrc && !img.complete) {
                      img.setAttribute('data-src', originalSrc);
                      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
                      lazyLoadObserver.observe(img);
                    }
                  }
                  
                  if (!img.classList.contains('loaded')) {
                    // 如果图片已经加载完成
                    if (img.complete) {
                      img.classList.add('loaded');
                      if (img.parentNode) {
                        img.parentNode.classList.add('loaded');
                      }
                    } else {
                      // 否则等待加载
                      img.addEventListener('load', function onLoad() {
                        img.classList.add('loaded');
                        if (img.parentNode) {
                          img.parentNode.classList.add('loaded');
                        }
                        img.removeEventListener('load', onLoad);
                      }, { once: true });
                      
                      // 处理加载错误
                      img.addEventListener('error', function onError() {
                        img.classList.add('loaded', 'error');
                        if (img.parentNode) {
                          img.parentNode.classList.add('loaded');
                        }
                        img.removeEventListener('error', onError);
                      }, { once: true });
                    }
                  }
                });
              });
            }
            
            // 性能优化：使用事件委托处理点击
            function setupImageClickHandlers() {
              // 使用事件委托，将点击事件绑定到document
              document.addEventListener('click', (e) => {
                // 查找被点击的图片或图片容器
                const img = e.target.closest('[data-preview="true"]');
                const container = e.target.closest('.image-container');
                
                if (img) {
                  e.preventDefault();
                  const images = collectImages();
                  const index = images.indexOf(img);
                  if (index !== -1) {
                    showImage(img, index);
                  }
                } else if (container) {
                  e.preventDefault();
                  const containerImg = container.querySelector('[data-preview="true"]');
                  if (containerImg) {
                    const images = collectImages();
                    const imgIndex = images.indexOf(containerImg);
                    if (imgIndex !== -1) {
                      showImage(containerImg, imgIndex);
                    }
                  }
                }
              }, { passive: false });
            }
            
            // 显示图片 - 性能优化：减少重绘
            function showImage(img, index) {
              if (isModalActive) return; // 防止重复操作
              
              isModalActive = true;
              currentIndex = index;
              
              // 批量更新DOM
              requestAnimationFrame(() => {
                // 显示加载指示器
                loadingIndicator.style.display = 'flex';
                modalImg.classList.remove('loaded');
                
                // 设置图片源
                modalImg.src = img.getAttribute('data-src') || img.src;
                modalImg.alt = img.alt || '预览图片';
                modal.classList.add('active');
                document.body.style.overflow = 'hidden'; // 禁止背景滚动
                
                // 图片加载完成后隐藏加载指示器
                if (modalImg.complete) {
                  modalImg.classList.add('loaded');
                  loadingIndicator.style.display = 'none';
                } else {
                  modalImg.onload = function() {
                    modalImg.classList.add('loaded');
                    loadingIndicator.style.display = 'none';
                  };
                  
                  modalImg.onerror = function() {
                    loadingIndicator.style.display = 'none';
                    // 可以在这里显示错误信息
                  };
                }
                
                updateNavigationButtons();
              });
            }
            
            // 更新导航按钮显示状态 - 性能优化：批量更新DOM
            function updateNavigationButtons() {
              const images = collectImages();
              const hasMultipleImages = images.length > 1;
              
              requestAnimationFrame(() => {
                prevBtn.style.display = hasMultipleImages ? 'block' : 'none';
                nextBtn.style.display = hasMultipleImages ? 'block' : 'none';
              });
            }
            
            // 显示上一张图片
            function showPreviousImage() {
              const images = collectImages();
              if (images.length <= 1) return;
              
              currentIndex = (currentIndex - 1 + images.length) % images.length;
              showImage(images[currentIndex], currentIndex);
            }
            
            // 显示下一张图片
            function showNextImage() {
              const images = collectImages();
              if (images.length <= 1) return;
              
              currentIndex = (currentIndex + 1) % images.length;
              showImage(images[currentIndex], currentIndex);
            }
              
            // 关闭模态框
            function closeModal() {
              modal.classList.remove('active');
              document.body.style.overflow = ''; // 恢复背景滚动
              isModalActive = false;
            }
            
            // 优化：减少事件监听器
            closeBtn.addEventListener('click', closeModal);
            prevBtn.addEventListener('click', showPreviousImage);
            nextBtn.addEventListener('click', showNextImage);
            
            // 事件委托处理模态框点击
            modal.addEventListener('click', (e) => {
              if (e.target === modal) {
                closeModal();
              }
            });
            
            // 键盘事件
            document.addEventListener('keydown', (e) => {
              if (!modal.classList.contains('active')) return;
              
              switch(e.key) {
                case 'Escape':
                  closeModal();
                  break;
                case 'ArrowLeft':
                  showPreviousImage();
                  break;
                case 'ArrowRight':
                  showNextImage();
                  break;
              }
            });
            
            // 初始化
            setupImageLoadHandlers();
            setupImageClickHandlers();
            
            // 性能优化：使用更高效的DOM变化监听
            // 使用更合适的配置，只监视必要的变化
            const observer = new MutationObserver((mutations) => {
              let hasNewImages = false;
              
              for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                  for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                      // 检查是否有新的图片或容器添加
                      if (node.querySelector('[data-preview="true"]') || 
                          node.matches('[data-preview="true"]')) {
                        hasNewImages = true;
                        break;
                      }
                    }
                  }
                  
                  if (hasNewImages) break;
                }
              }
              
              // 只有在确实有新图片添加时才更新
              if (hasNewImages) {
                // 清除缓存的图片列表，强制重新收集
                allImages = [];
                setupImageLoadHandlers();
              }
            });
            
            observer.observe(document.body, { 
              childList: true, 
              subtree: true,
              attributes: false, // 不监视属性变化
              characterData: false // 不监视文本变化
            });
            
            // 预加载可视区域内的图片
            setupImageLoadHandlers();
          }

          // 性能优化：使用requestIdleCallback在浏览器空闲时初始化非关键功能
          function initOnIdle() {
            // 定义空闲回调
            const idleCallback = () => {
              // 初始化返回顶部按钮
              initBackToTop();
            };
            
            // 使用requestIdleCallback或setTimeout作为降级处理
            if ('requestIdleCallback' in window) {
              requestIdleCallback(idleCallback);
            } else {
              setTimeout(idleCallback, 200);
            }
          }

          // 页面加载完成后初始化所有功能
          document.addEventListener('DOMContentLoaded', () => {
            // 立即初始化关键功能
            initThemeToggle();
            initImageViewer();
            
            // 延迟初始化非关键功能
            initOnIdle();
          });
        })();
        </script>
      </body>
    </html>
  `;
} 