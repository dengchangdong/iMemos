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
    
    if (resources.length > 0) {
      // 根据图片数量决定布局
      if (resources.length === 1) {
        // 单张图片 - 100%宽度
        resourcesHtml = utils.createHtml`
          <figure class="mt-4">
            <div class="w-full relative aspect-video bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden image-container">
              <img 
                src="${resources[0].externalLink || ''}" 
                alt="${resources[0].filename || '图片'}"
                class="rounded-lg w-full h-full object-cover hover:opacity-95 transition-opacity absolute inset-0 z-10"
                loading="lazy"
                data-preview="true"
                onload="this.classList.add('loaded'); this.parentNode.classList.add('loaded')"
              />
              <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 opacity-100 transition-opacity duration-300 image-placeholder">
                <i class="ri-image-line text-3xl"></i>
              </div>
            </div>
          </figure>
        `;
      } else if (resources.length === 2) {
        // 两张图片 - 各50%宽度
        resourcesHtml = utils.createHtml`
          <figure class="mt-4">
            <div class="flex flex-wrap gap-1">
              ${resources.map(resource => utils.createHtml`
                <div class="w-[calc(50%-2px)] relative bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden aspect-square image-container">
                  <img 
                    src="${resource.externalLink || ''}" 
                    alt="${resource.filename || '图片'}"
                    class="rounded-lg w-full h-full object-cover hover:opacity-95 transition-opacity absolute inset-0 z-10"
                    loading="lazy"
                    data-preview="true"
                    onload="this.classList.add('loaded'); this.parentNode.classList.add('loaded')"
                  />
                  <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 opacity-100 transition-opacity duration-300 image-placeholder">
                    <i class="ri-image-line text-3xl"></i>
                  </div>
                </div>
              `).join('')}
            </div>
          </figure>
        `;
      } else {
        // 三张或更多图片 - 九宫格布局
        resourcesHtml = utils.createHtml`
          <figure class="mt-4">
            <div class="grid grid-cols-3 gap-1">
              ${resources.map(resource => utils.createHtml`
                <div class="aspect-square relative bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden image-container">
                  <img 
                    src="${resource.externalLink || ''}" 
                    alt="${resource.filename || '图片'}"
                    class="rounded-lg w-full h-full object-cover hover:opacity-95 transition-opacity absolute inset-0 z-10"
                    loading="lazy"
                    data-preview="true"
                    onload="this.classList.add('loaded'); this.parentNode.classList.add('loaded')"
                  />
                  <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 opacity-100 transition-opacity duration-300 image-placeholder">
                    <i class="ri-image-line text-2xl"></i>
                  </div>
                </div>
              `).join('')}
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
        <!-- 资源预加载 -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
        <!-- 预加载关键资源 -->
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" as="style">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500&family=Roboto&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com" defer></script>
        <script>
          // 初始化主题以避免闪烁
          (function() {
            const theme = localStorage.getItem('theme');
            if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
            }
          })();
          
          // 配置Tailwind
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
          body {
            will-change: scroll-position;
            overflow-anchor: none;
          }
          
          /* 优化渐变背景性能 */
          .bg-custom-gradient, .bg-custom-gradient-dark {
            will-change: transform;
            backface-visibility: hidden;
            perspective: 1000;
            transform: translate3d(0, 0, 0);
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
            transition: opacity 0.3s ease;
            will-change: transform, opacity;
          }
          
          .dark .back-to-top {
            background-color: #209cff;
            color: white;
          }
          
          .back-to-top:hover {
            background-color: #0c7cd5;
            color: white;
            transform: translateY(-2px);
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
          }

          .image-modal.active {
            display: flex;
            opacity: 1;
          }

          .image-modal-content {
            max-width: 90%;
            max-height: 90%;
            position: relative;
          }

          .image-modal-content img {
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 4px;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .image-modal-content img.loaded {
            opacity: 1;
          }
          
          .image-loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
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
          }
          
          .image-container img {
            z-index: 2;
          }
          
          .image-placeholder {
            z-index: 1;
          }
        </style>
      </head>
      <body class="min-h-screen bg-custom-gradient dark:bg-custom-gradient-dark bg-fixed m-0 p-0 font-sans">
        <div class="container px-4 py-12 sm:px-4 sm:py-12 px-[10px] py-[20px]">
          <section class="bg-blue-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full sm:p-8 p-[15px]" style="content-visibility: auto;">
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
                  <i class="ri-sun-fill text-lg" id="theme-icon" aria-hidden="true"></i>
                </button>
              </div>
            </header>
            <main class="mt-8 relative" style="content-visibility: auto;">
              ${articlesHtml}
            </main>
          </section>
        </div>

        <button id="back-to-top" class="back-to-top" aria-label="返回顶部">
          <i class="ri-skip-up-fill text-xl" aria-hidden="true"></i>
        </button>
        
        <!-- 图片预览模态框 -->
        <div id="imageModal" class="image-modal" aria-modal="true" aria-label="图片预览">
          <div class="image-modal-content">
            <button class="image-modal-close" aria-label="关闭预览">
              <i class="ri-close-line" aria-hidden="true"></i>
            </button>
            <div class="image-loading" role="status" aria-live="polite">
              <div class="spinner" aria-hidden="true"></div>
              <span>加载中...</span>
            </div>
            <figure class="w-full h-full flex items-center justify-center">
              <img id="modalImage" src="" alt="预览图片" loading="lazy" class="max-w-full max-h-[90vh] object-contain">
            </figure>
            <button class="image-modal-prev" aria-label="上一张">
              <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
            </button>
            <button class="image-modal-next" aria-label="下一张">
              <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <script>
        // 使用自执行函数封装所有代码，避免污染全局作用域
        (function() {
          // 主题切换功能
          function initThemeToggle() {
            const themeToggle = document.getElementById('theme-toggle');
            const themeIcon = document.getElementById('theme-icon');
            const html = document.documentElement;
            
            // 主题模式
            const themes = ['system', 'light', 'dark'];
            let currentTheme = 0; // 默认跟随系统
            
            // 更新图标
            function updateIcon(theme) {
              if (theme === 'light') {
                themeIcon.className = 'ri-sun-fill text-lg';
                themeToggle.setAttribute('aria-label', '切换到深色模式');
              } else if (theme === 'dark') {
                themeIcon.className = 'ri-moon-fill text-lg';
                themeToggle.setAttribute('aria-label', '切换到浅色模式');
              } else {
                themeIcon.className = 'ri-contrast-fill text-lg';
                themeToggle.setAttribute('aria-label', '切换到系统模式');
              }
            }
            
            // 应用主题
            function applyTheme(theme) {
              if (theme === 'light') {
                html.classList.remove('dark');
                localStorage.theme = 'light';
              } else if (theme === 'dark') {
                html.classList.add('dark');
                localStorage.theme = 'dark';
              } else {
                // 跟随系统
                localStorage.removeItem('theme');
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  html.classList.add('dark');
                } else {
                  html.classList.remove('dark');
                }
              }
              updateIcon(theme);
            }
            
            // 检查本地存储的主题
            if (localStorage.theme === 'dark') {
              html.classList.add('dark');
              currentTheme = 2; // dark
              updateIcon('dark');
            } else if (localStorage.theme === 'light') {
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
            
            // 点击切换主题
            themeToggle.addEventListener('click', () => {
              currentTheme = (currentTheme + 1) % 3;
              const newTheme = themes[currentTheme];
              applyTheme(newTheme);
            });

            // 监听系统主题变化
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
              if (!localStorage.theme) { // 只在跟随系统模式下响应
                if (e.matches) {
                  html.classList.add('dark');
                } else {
                  html.classList.remove('dark');
                }
              }
            });
          }

          // 返回顶部功能
          function initBackToTop() {
            const backToTop = document.getElementById('back-to-top');
            let ticking = false;
            let lastScrollY = 0;
            
            // 节流函数 - 限制函数执行频率
            function throttle(callback, delay = 100) {
              let isThrottled = false;
              return function(...args) {
                if (isThrottled) return;
                isThrottled = true;
                callback.apply(this, args);
                setTimeout(() => {
                  isThrottled = false;
                }, delay);
              };
            }
            
            // 优化的滚动处理函数
            const handleScroll = throttle(() => {
              const currentScrollY = window.scrollY;
              
              // 只有滚动位置有明显变化时才更新DOM
              if (Math.abs(currentScrollY - lastScrollY) > 50 || 
                 (currentScrollY > 300 && lastScrollY <= 300) || 
                 (currentScrollY <= 300 && lastScrollY > 300)) {
                
                if (currentScrollY > 300) {
                  if (!backToTop.classList.contains('visible')) {
                    backToTop.classList.add('visible');
                  }
                } else {
                  if (backToTop.classList.contains('visible')) {
                    backToTop.classList.remove('visible');
                  }
                }
                
                lastScrollY = currentScrollY;
              }
              
              ticking = false;
            }, 100);
            
            // 使用 requestAnimationFrame 进一步优化
            window.addEventListener('scroll', () => {
              if (!ticking) {
                window.requestAnimationFrame(() => {
                  handleScroll();
                });
                ticking = true;
              }
            }, { passive: true });
              
            // 点击返回顶部
            backToTop.addEventListener('click', () => {
              window.scrollTo({
                top: 0,
                behavior: 'smooth'
              });
            });

            // 检查初始滚动位置
            if (window.scrollY > 300) {
              backToTop.classList.add('visible');
              lastScrollY = window.scrollY;
            }
          }
        
          // 图片预览功能
          function initImageViewer() {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            const closeBtn = modal.querySelector('.image-modal-close');
            const prevBtn = modal.querySelector('.image-modal-prev');
            const nextBtn = modal.querySelector('.image-modal-next');
            const loadingIndicator = modal.querySelector('.image-loading');
            
            let allImages = [];
            let currentIndex = 0;
            let observerTimeout = null;
            
            // 获取所有可点击图片 - 使用缓存优化
            function collectImages() {
              allImages = Array.from(document.querySelectorAll('[data-preview="true"]'));
              return allImages;
            }
            
            // 懒加载图片处理
            function setupImageLoadHandlers() {
              collectImages().forEach((img) => {
                if (!img.classList.contains('loaded') && !img.dataset.loadHandled) {
                  img.dataset.loadHandled = 'true';
                  
                  // 如果图片已经加载完成
                  if (img.complete) {
                    img.classList.add('loaded');
                    // 找到父容器并添加loaded类
                    const container = img.closest('.image-container');
                    if (container) container.classList.add('loaded');
                  } else {
                    // 否则等待加载
                    img.addEventListener('load', function() {
                      img.classList.add('loaded');
                      // 找到父容器并添加loaded类
                      const container = img.closest('.image-container');
                      if (container) container.classList.add('loaded');
                    }, { once: true }); // 使用once确保事件只触发一次
                    
                    // 处理加载错误
                    img.addEventListener('error', function() {
                      img.classList.add('loaded');
                      img.classList.add('error');
                      // 找到父容器并添加loaded类
                      const container = img.closest('.image-container');
                      if (container) container.classList.add('loaded', 'error');
                    }, { once: true });
                  }
                }
              });
            }
            
            // 为所有图片容器添加点击事件 - 使用事件委托优化
            function setupImageClickHandlers() {
              // 只对新图片添加处理，避免重复
              collectImages().forEach((img) => {
                if (!img.dataset.hasClickHandler) {
                  img.dataset.hasClickHandler = 'true';
                  img.style.cursor = 'pointer';
                }
              });
              
              // 使用事件委托，只在document.body上设置一个监听器
              if (!document.body.dataset.hasImageClickListener) {
                document.body.dataset.hasImageClickListener = 'true';
                
                document.body.addEventListener('click', (e) => {
                  // 检查点击的是否是图片或图片容器
                  const img = e.target.closest('[data-preview="true"]');
                  if (img) {
                    // 阻止事件冒泡
                    e.stopPropagation();
                    
                    // 重新获取所有图片，确保索引正确
                    const images = collectImages();
                    const index = images.indexOf(img);
                    if (index !== -1) {
                      showImage(img, index);
                    }
                    return;
                  }
                  
                  // 如果点击的是图片容器
                  const container = e.target.closest('.image-container');
                  if (container) {
                    const containerImg = container.querySelector('[data-preview="true"]');
                    if (containerImg) {
                      // 阻止事件冒泡
                      e.stopPropagation();
                      
                      // 重新获取所有图片，确保索引正确
                      const images = collectImages();
                      const index = images.indexOf(containerImg);
                      if (index !== -1) {
                        showImage(containerImg, index);
                      }
                    }
                  }
                });
              }
            }
            
            // 显示图片 - 优化图片加载逻辑
            function showImage(img, index) {
              // 显示加载指示器
              loadingIndicator.style.display = 'flex';
              modalImg.classList.remove('loaded');
              
              // 如果图片源相同，不重新加载
              if (modalImg.src !== img.src) {
                // 设置图片源
                modalImg.src = img.src;
              }
              
              modalImg.alt = img.alt || '预览图片';
              modal.classList.add('active');
              currentIndex = index;
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
            }
            
            // 更新导航按钮显示状态 - 优化DOM操作
            function updateNavigationButtons() {
              const shouldShowButtons = allImages.length > 1;
              const prevVisible = prevBtn.style.display !== 'none';
              const nextVisible = nextBtn.style.display !== 'none';
              
              // 只在状态变化时更新DOM
              if (shouldShowButtons !== prevVisible) {
                prevBtn.style.display = shouldShowButtons ? 'block' : 'none';
                nextBtn.style.display = shouldShowButtons ? 'block' : 'none';
              }
            }
            
            // 显示上一张图片
            function showPreviousImage() {
              if (allImages.length <= 1) return;
              
              currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
              showImage(allImages[currentIndex], currentIndex);
            }
            
            // 显示下一张图片
            function showNextImage() {
              if (allImages.length <= 1) return;
              
              currentIndex = (currentIndex + 1) % allImages.length;
              showImage(allImages[currentIndex], currentIndex);
            }
              
            // 关闭模态框
            function closeModal() {
              modal.classList.remove('active');
              document.body.style.overflow = ''; // 恢复背景滚动
            }
            
            // 绑定事件
            closeBtn.addEventListener('click', closeModal);
            prevBtn.addEventListener('click', showPreviousImage);
            nextBtn.addEventListener('click', showNextImage);
            
            // 点击背景关闭
            modal.addEventListener('click', (e) => {
              if (e.target === modal) {
                closeModal();
              }
            });
            
            // 键盘事件
            document.addEventListener('keydown', (e) => {
              if (!modal.classList.contains('active')) return;
              
              if (e.key === 'Escape') {
                closeModal();
              } else if (e.key === 'ArrowLeft') {
                showPreviousImage();
              } else if (e.key === 'ArrowRight') {
                showNextImage();
              }
            });
            
            // 初始化
            setupImageLoadHandlers();
            setupImageClickHandlers();
            
            // 优化 MutationObserver - 防止频繁触发
            const observer = new MutationObserver(() => {
              // 清除之前的定时器
              if (observerTimeout) {
                clearTimeout(observerTimeout);
              }
              
              // 延迟执行，避免短时间内多次DOM变化导致的频繁处理
              observerTimeout = setTimeout(() => {
                setupImageLoadHandlers();
                setupImageClickHandlers();
                observerTimeout = null;
              }, 200);
            });
            
            observer.observe(document.body, { 
              childList: true, 
              subtree: true,
              attributes: false // 不监听属性变化，减少触发次数
            });
            
            // 清理函数 - 页面卸载时断开观察器
            window.addEventListener('beforeunload', () => {
              observer.disconnect();
            });
          }

          // 页面加载完成后初始化所有功能
          document.addEventListener('DOMContentLoaded', () => {
            initThemeToggle();
            initBackToTop();
            initImageViewer();
          });
        })();
        </script>
      </body>
    </html>
  `;
} 