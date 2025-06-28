import { html } from 'hono/html'
import { CONFIG } from './config.js'
import { utils } from './utils.js'
import { simpleMarkdown } from './markdown.js'

/**
 * 优化HTML模板渲染 - 减少重复代码
 */
export const htmlTemplates = {
  /**
   * 错误页面模板
   * @param {Error} error - 错误对象
   * @returns {string} 错误页面HTML
   */
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
  
  /**
   * 404页面模板
   * @returns {string} 404页面HTML
   */
  notFoundPage() {
    return createArticleStructure(
      utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">404</time>`,
      utils.createHtml`
        <h2 class="font-medium">未找到内容</h2>
        <p>您访问的内容不存在或已被删除</p>
        <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
      `
    );
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
    <article class="pb-8 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
      <header>${header}</header>
      <section class="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 md:text-base text-sm article-content">
        ${content}
      </section>
    </article>
  `;
}

/**
 * 渲染单个 memo
 * @param {Object} memo - memo对象
 * @param {boolean} [isHomePage=false] - 是否在首页显示
 * @returns {string} 渲染后的HTML
 */
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
      <div class="flex">
        <a class="block" href="${articleUrl}">
          <time datetime="${new Date(timestamp).toISOString()}" class="text-blue-600 dark:text-blue-400 font-poppins font-semibold block md:text-sm text-xs hover:text-indigo-600 dark:hover:text-indigo-300 transition-all hover:scale-105 px-3 py-1.5 rounded-lg bg-blue-50/70 dark:bg-blue-900/30 shadow-soft-sm">${formattedTime}</time>
        </a>
      </div>
    `;
    
    // 创建文章内容
    const articleContent = utils.createHtml`
      <div class="prose prose-blue prose-sm sm:prose-base dark:prose-invert max-w-none">
        ${parsedContent}
      </div>
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

// 创建资源HTML
const renderImageItem = (resource, itemClass) => {
  const originalLink = resource.externalLink || '';
  const transformedLink = originalLink.replace(
    'images-memos.dengchangdong.com',
    'images-memos.dengchangdong.com/cdn-cgi/image/h=800'
  );

  return utils.createHtml`
    <div class="${itemClass} relative bg-blue-50/40 dark:bg-gray-700/40 rounded-xl overflow-hidden shadow-soft transition-all duration-300 hover:shadow-soft-hover hover:translate-y-[-2px]">
      <img src="${transformedLink}" alt="${resource.filename || '图片'}" class="rounded-xl w-full h-full object-cover transition-all duration-300 absolute inset-0 z-10 hover:scale-103 opacity-0" loading="lazy" data-preview="true"/>
      <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 image-placeholder">
        <i class="ri-image-line text-2xl animate-pulse"></i>
      </div>
    </div>
  `;
};

function createResourcesHtml(resources) {
  const count = resources.length;

  if (count === 0) {
    return '';
  }

  const layoutConfig = {
    1: { 
      container: '',                 
      item: 'w-full aspect-video' 
    },
    2: { 
      container: 'flex flex-wrap gap-2', 
      item: 'w-[calc(50%-4px)] aspect-square' 
    },
    default: { 
      container: 'grid grid-cols-3 gap-2', 
      item: 'aspect-square' 
    },
  };

  const { container: containerClass, item: itemClass } = 
    layoutConfig[count] || layoutConfig.default;

  const imagesHtml = resources
    .map(resource => renderImageItem(resource, itemClass))
    .join('');

  const content = containerClass
    ? `<div class="${containerClass}">${imagesHtml}</div>`
    : imagesHtml;

  return utils.createHtml`
    <figure class="mt-5">
      ${content}
    </figure>
  `;
}

// 渲染分页导航
function renderPagination({ currentPage, hasMore, isHomePage, tag = '', memosCount = 0, pageLimit = CONFIG.PAGE_LIMIT }) {
  if (!isHomePage && !tag) {
    return '';
  }
  
  // 当文章数量少于PAGE_LIMIT配置的数量时不显示分页导航
  if (!hasMore && memosCount < pageLimit) {
    return '';
  }

  const buttonClass = "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-gradient-to-r from-blue-500 to-blue-600 text-white no-underline border-none cursor-pointer hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5 hover:shadow-lg shadow-md";

  if (isHomePage && currentPage === 1) {
    return utils.createHtml`
      <div class="pagination flex justify-center items-center mt-8">
        <a href="/page/2" class="${buttonClass}">
          <i class="ri-arrow-down-line text-xl mr-2"></i> 查看更多内容
        </a>
      </div>
    `;
  }

  const prevPageLink = currentPage > 2 ? `/page/${currentPage - 1}` : '/';
  const nextPageLink = `/page/${currentPage + 1}`;

  return utils.createHtml`
    <div class="pagination flex justify-between items-center mt-8">
      <a href="${prevPageLink}" class="${buttonClass}">
        <i class="ri-arrow-left-line text-xl mr-2"></i> 上一页
      </a>
      <span class="text-sm bg-blue-100/70 dark:bg-blue-900/30 px-4 py-1.5 rounded-full text-blue-700 dark:text-blue-300 font-medium">第 ${currentPage} 页</span>
      <a href="${nextPageLink}" class="${buttonClass} ${hasMore ? '' : 'invisible'}">
        下一页 <i class="ri-arrow-right-line text-xl ml-2"></i>
      </a>
    </div>
  `;
}

// 渲染基础 HTML
export function renderBaseHtml(title, content, navLinks, siteName, currentPage = 1, hasMore = false, isHomePage = false, tag = '', memosCount = 0, pageLimit = CONFIG.PAGE_LIMIT) {
  const navItems = parseNavLinks(navLinks)
  const navItemsHtml = navItems.length > 0 
    ? navItems.map(item => utils.createHtml`
        <li><a href="${item.url}" class="px-3 py-1.5 rounded-md transition-all block text-sm font-medium hover:bg-orange-200 text-orange-500 hover:text-orange-700 hover:scale-105">${item.text}</a></li>
      `).join('')
    : '';

  const articlesHtml = Array.isArray(content) ? content.join('') : content;

  return utils.createHtml`
    <!DOCTYPE html>
    <html lang="zh-CN" class="scroll-smooth">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="${siteName}">
        <meta name="theme-color" content="#209cff">
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Poppins:wght@500&family=Roboto&display=swap" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/3.5.0/remixicon.min.css" rel="stylesheet">
        <link rel="alternate" type="application/rss+xml" title="${siteName}" href="/rss.xml" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                backgroundImage: {
                  'custom-gradient': 'linear-gradient(45deg, #f5f7fa, #e4e8f0)',
                  'custom-gradient-dark': 'linear-gradient(45deg, #1e293b, #111827)',
                },
                colors: {
                  'indigo-timeline': '#3b82f6',
                  'indigo-shadow': '#93c5fd',
                },
                fontFamily: {
                  'sans': ['Noto Sans SC', 'sans-serif'],
                  'poppins': ['Poppins', 'sans-serif'],
                }
              }
            }
          }
        </script>
        <style>
          ${clientStyle}
        </style>
      </head>
      <body class="min-h-screen bg-custom-gradient dark:bg-custom-gradient-dark bg-fixed m-0 p-0 font-sans">
        <div class="container w-full max-w-xl [@media(min-width:1921px)]:max-w-2xl mx-auto px-4 py-8 sm:py-12">
          <section class="bg-white/95 dark:bg-gray-800/95 p-6 sm:p-12 rounded-2xl shadow-soft backdrop-blur-sm transition-all duration-300">
            <header class="flex items-center justify-between">
              <div class="flex items-center">
                <a href="/" class="flex items-center" aria-label="返回首页">
                  <h1 class="text-2xl font-semibold font-poppins mb-0 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">${siteName}</h1>
                </a>
              </div>
              <div class="flex items-center space-x-4">
                <!-- 网站导航
                <nav class="mr-1" aria-label="网站导航">
                  <ul class="flex space-x-2">
                    ${navItemsHtml}
                  </ul>
                </nav>
                 -->
                <a href="/rss.xml" class="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-800/40 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200 focus:outline-none focus:ring-0 focus:border-0 transition-all duration-200 shadow-soft transform hover:scale-105 hover:translate-y-[-2px] active:scale-100 active:translate-y-0" aria-label="RSS订阅" title="RSS订阅">
                  <i class="ri-rss-fill text-lg" aria-hidden="true"></i>
                </a>
                <button id="theme-toggle" class="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-800/40 text-blue-500 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200 focus:outline-none focus:ring-0 focus:border-0 transition-all duration-200 shadow-soft transform hover:scale-105 hover:translate-y-[-2px] active:scale-100 active:translate-y-0" aria-label="切换主题">
                  <i class="ri-sun-fill text-lg" id="theme-icon" aria-hidden="true"></i>
                </button>
              </div>
            </header>
            <main class="mt-8 sm:mt-10 relative">
              ${articlesHtml}
            </main>
            
            <!-- 分页导航 -->
            ${renderPagination({ currentPage, hasMore, isHomePage, tag, memosCount, pageLimit })}
          </section>
        </div>

        <button 
          id="back-to-top" 
          class="back-to-top fixed bottom-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 text-blue-500 dark:text-blue-300 shadow-soft cursor-pointer z-50 opacity-0 invisible transition-all duration-300 ease-in-out transform hover:translate-y-[-2px] hover:scale-105 hover:shadow-soft-hover"
          aria-label="返回顶部"
        >
          <i class="ri-arrow-up-line text-xl" aria-hidden="true"></i>
        </button>
        
        <!-- 图片预览模态框 -->
        <div 
          id="imageModal" 
          class="image-modal fixed inset-0 w-full h-full bg-black/80 z-[100] justify-center items-center opacity-0 transition-opacity duration-300 ease-in-out will-change-opacity hidden backdrop-blur-md"
          aria-modal="true" 
          aria-label="图片预览"
        >
          <div class="image-modal-content relative max-w-[90%] max-h-[90%] will-change-transform transform-gpu">
            <button 
              class="image-modal-close absolute -top-12 right-0 text-white text-2xl cursor-pointer bg-transparent border-none p-2 will-change-transform hidden"
              aria-label="关闭预览"
            >
              <i class="ri-close-line" aria-hidden="true"></i>
            </button>
            
            <div 
              class="image-loading absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-base flex flex-col items-center gap-2.5"
              role="status" 
              aria-live="polite"
            >
              <div class="spinner w-10 h-10 border-[3px] border-white/30 rounded-full border-t-white animate-spin will-change-transform"></div>
            </div>
            
            <figure class="w-full h-full flex items-center justify-center">
              <img 
                id="modalImage" 
                src="" 
                alt="预览图片" 
                loading="lazy" 
                class="max-w-full h-[70vh] max-w-[90vw] object-contain rounded opacity-0 transition-opacity duration-300 ease-in-out will-change-opacity"
              >
            </figure>
            
            <button 
              class="image-modal-prev absolute top-1/2 -translate-y-1/2 left-2.5 bg-black/50 text-white border-none text-2xl cursor-pointer w-10 h-10 rounded-full hidden items-center justify-center transition-all duration-200 will-change-transform hover:bg-black/70 hover:scale-110"
              aria-label="上一张"
            >
              <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
            </button>
            
            <button 
              class="image-modal-next absolute top-1/2 -translate-y-1/2 right-2.5 bg-black/50 text-white border-none text-2xl cursor-pointer w-10 h-10 rounded-full hidden items-center justify-center transition-all duration-200 will-change-transform hover:bg-black/70 hover:scale-110"
              aria-label="下一张"
            >
              <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <script>
          ${clientScript}
        </script>
      </body>
    </html>
  `;
}

const clientStyle = `
  /* 基本滚动条样式 */
  html::-webkit-scrollbar, 
  body::-webkit-scrollbar,
  pre::-webkit-scrollbar {
    width: 8px;
    height: 8px;
    background: rgba(255, 255, 255, 0);
    border-radius: 10px;
  }

  /* 移除按钮和链接的焦点边框 */
  button, a {
    -webkit-tap-highlight-color: transparent;
  }

  button:focus, a:focus {
    outline: none !important;
    box-shadow: none !important;
  }

  html::-webkit-scrollbar-thumb, 
  body::-webkit-scrollbar-thumb,
  pre::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
  }

  html::-webkit-scrollbar-thumb:hover, 
  body::-webkit-scrollbar-thumb:hover,
  pre::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 10px; 
  }

  html::-webkit-scrollbar-track:hover, 
  body::-webkit-scrollbar-track:hover,
  pre::-webkit-scrollbar-track:hover {
    background: rgba(0, 0, 0, 0);
    border-radius: 10px; 
  }
  
  /* 主题切换过渡 */
  .theme-transition {
    transition: background 0.5s ease, color 0.5s ease;
  }
  
  /* 按钮点击反馈 */
  .button-clicked {
    animation: button-click 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  @keyframes button-click {
    0% { transform: scale(1); }
    50% { transform: scale(0.9); }
    100% { transform: scale(1); }
  }
  
  /* 图片切换动画 */
  .slide-left {
    animation: slide-from-right 0.3s forwards cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  .slide-right {
    animation: slide-from-left 0.3s forwards cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  @keyframes slide-from-right {
    0% { opacity: 0; transform: translateX(15px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes slide-from-left {
    0% { opacity: 0; transform: translateX(-15px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  
  /* 新增字体样式 */
  body {
    font-family: 'Noto Sans SC', sans-serif;
    letter-spacing: 0.02em;
    line-height: 1.6;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Noto Sans SC', sans-serif;
    letter-spacing: -0.01em;
  }
  
  /* 改进阴影效果 - 轻拟物风格 */
  .shadow-soft {
    box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.05), 
                -6px -6px 12px rgba(255, 255, 255, 0.8);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  .dark .shadow-soft {
    box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.3), 
                -6px -6px 12px rgba(255, 255, 255, 0.04);
  }

  .shadow-soft-hover {
    box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.06), 
                -8px -8px 16px rgba(255, 255, 255, 0.9);
  }
  
  .dark .shadow-soft-hover {
    box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.35), 
                -8px -8px 16px rgba(255, 255, 255, 0.05);
  }

  /* 轻量阴影效果 */
  .shadow-soft-sm {
    box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.03), 
                -3px -3px 6px rgba(255, 255, 255, 0.7);
  }
  
  .dark .shadow-soft-sm {
    box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.2), 
                -3px -3px 6px rgba(255, 255, 255, 0.03);
  }
  
  /* 文章样式与动画 */
  article {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    padding-left: 1.5rem;
    margin-left: 0.5rem;
    position: relative;
    z-index: 1;
  }
  
  article:hover {
    transform: translateY(-2px);
  }

  /* article的before伪元素样式 - 轻拟物风格圆点 */
  article::before {
    content: '';
    width: 16px;
    height: 16px;
    background-color: #f0f4f8;
    border: 1px solid rgba(59, 130, 246, 0.5);
    border-radius: 50%;
    position: absolute;
    left: -8px;
    top: 0;
    box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.05),
                inset -2px -2px 5px rgba(255, 255, 255, 0.7),
                3px 3px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    z-index: 2;
  }
  
  .dark article::before {
    background-color: #2d3748;
    border-color: rgba(96, 165, 250, 0.3);
    box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.2),
                inset -2px -2px 5px rgba(255, 255, 255, 0.02),
                3px 3px 8px rgba(0, 0, 0, 0.2);
  }
  
  article:hover::before {
    transform: scale(1.15);
    background-color: #e6effc;
    border-color: rgba(59, 130, 246, 0.8);
    box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.03),
                inset -1px -1px 3px rgba(255, 255, 255, 0.8),
                4px 4px 10px rgba(0, 0, 0, 0.06);
  }
  
  .dark article:hover::before {
    background-color: #3b4859;
    border-color: rgba(96, 165, 250, 0.5);
    box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.25),
                inset -1px -1px 3px rgba(255, 255, 255, 0.03),
                4px 4px 10px rgba(0, 0, 0, 0.25);
  }
  
  /* 轻拟物风格表单元素 */
  input, textarea, select {
    background-color: #f0f4f8;
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 0.75rem 1rem;
    box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.03),
                inset -2px -2px 5px rgba(255, 255, 255, 0.8);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  .dark input, .dark textarea, .dark select {
    background-color: #2d3748;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.2),
                inset -2px -2px 5px rgba(255, 255, 255, 0.02);
    color: #e5e7eb;
  }
  
  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.5);
    box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.02),
                inset -1px -1px 3px rgba(255, 255, 255, 0.7),
                0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .dark input:focus, .dark textarea:focus, .dark select:focus {
    border-color: rgba(96, 165, 250, 0.3);
    box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.15),
                inset -1px -1px 3px rgba(255, 255, 255, 0.01),
                0 0 0 3px rgba(96, 165, 250, 0.1);
  }
  
  /* 按钮动画效果 - 轻拟物化风格 */
  button, .pagination a {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  .pagination a {
    background: linear-gradient(145deg, #3b82f6, #4f46e5);
    box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.1),
                -2px -2px 6px rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    color: #ffffff;
    font-weight: 500;
    border: none;
    padding: 0.5rem 1rem;
  }
  
  .pagination a:hover {
    background: linear-gradient(145deg, #4f46e5, #3b82f6);
    transform: translateY(-2px);
    box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.12),
                -3px -3px 8px rgba(255, 255, 255, 0.06);
  }
  
  .pagination a:active {
    transform: translateY(0);
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1),
                -1px -1px 3px rgba(255, 255, 255, 0.05);
    background: linear-gradient(145deg, #4338ca, #3b82f6);
  }

  /* 图片模态框样式 */
  .image-modal.active {
    display: flex;
    opacity: 1;
  }

  .image-modal-content img.loaded {
    opacity: 1;
  }

  .back-to-top.visible {
    opacity: 1;
    visibility: visible;
  }

  .article-content img, .mt-4 img, .mt-5 img {
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    background-color: #f0f4f8;
    opacity: 0.9;
    will-change: opacity, transform;
    border-radius: 12px;
    box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.08),
                -4px -4px 10px rgba(255, 255, 255, 0.8);
  }

  .dark .article-content img, .dark .mt-4 img, .dark .mt-5 img {
    background-color: #2d3748;
    box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.2),
                -4px -4px 10px rgba(255, 255, 255, 0.03);
  }

  .article-content img.loaded, .mt-4 img.loaded, .mt-5 img.loaded {
    opacity: 1;
  }

  .article-content img:hover, .mt-4 img:hover, .mt-5 img:hover {
    opacity: 1;
    transform: scale(1.02);
    box-shadow: 6px 6px 14px rgba(0, 0, 0, 0.1),
                -6px -6px 14px rgba(255, 255, 255, 0.9);
  }

  .dark .article-content img:hover, .dark .mt-4 img:hover, .dark .mt-5 img:hover {
    box-shadow: 6px 6px 14px rgba(0, 0, 0, 0.25),
                -6px -6px 14px rgba(255, 255, 255, 0.04);
  }

  .image-placeholder {
    opacity: 1;
    transition: opacity 0.3s ease;
    will-change: opacity;
  }

  div.loaded .image-placeholder {
    opacity: 0;
  }
  
  /* 链接样式 - 使用色相对比 */
  a {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
    color: #3b82f6;
  }
  
  .dark a {
    color: #60a5fa;
  }
  
  a:not(.pagination a):hover {
    text-decoration: none;
    color: #4f46e5;
  }
  
  .dark a:not(.pagination a):hover {
    color: #818cf8;
  }
  
  a:not(.pagination a):after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1px;
    background: currentColor;
    transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  a:not(.pagination a):hover:after {
    width: 100%;
  }
  
  /* 代码块优化 - 轻拟物风格 */
  .code-block {
    border-radius: 12px;
    box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.08),
                -6px -6px 12px rgba(255, 255, 255, 0.8);
    margin: 1.5em 0;
    overflow: hidden;
    background: #f8fafc;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .dark .code-block {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 6px 6px 12px rgba(0, 0, 0, 0.2),
                -6px -6px 12px rgba(255, 255, 255, 0.02);
  }
  
  pre {
    border-radius: 12px;
    margin: 1.5em 0;
    background: #f8fafc;
    padding: 1rem;
    overflow-x: auto;
  }
  
  .dark pre {
    background: #1e293b;
  }
  
  .code-header {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    background: #f1f5f9;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .dark .code-header {
    background: #1a202c;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .code-header + pre {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    margin-top: 0;
  }
  
  .code-block pre {
    margin: 0;
  }
  
  code {
    font-family: 'Roboto Mono', monospace;
  }

  /* 文本渲染优化 */
  .article-content, .prose {
    font-size: 15px;
    line-height: 1.75;
    color: #1f2937;
  }

  .dark .article-content, .dark .prose {
    color: #e5e7eb;
  }

  .article-content p, .prose p {
    margin-bottom: 1.25em;
  }
  
  /* 页面加载动画 */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes softReveal {
    0% { opacity: 0; transform: translateY(10px); }
    50% { opacity: 0.5; transform: translateY(5px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  main {
    animation: fadeIn 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  article {
    animation: slideIn 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
    animation-fill-mode: both;
  }

  article section {
    animation: softReveal 0.7s cubic-bezier(0.25, 0.8, 0.25, 1);
    animation-fill-mode: both;
  }
  
  article:nth-child(2) { animation-delay: 0.1s; }
  article:nth-child(3) { animation-delay: 0.2s; }
  article:nth-child(4) { animation-delay: 0.3s; }
  article:nth-child(5) { animation-delay: 0.4s; }

  article:nth-child(2) section { animation-delay: 0.2s; }
  article:nth-child(3) section { animation-delay: 0.3s; }
  article:nth-child(4) section { animation-delay: 0.4s; }
  article:nth-child(5) section { animation-delay: 0.5s; }

  /* 微交互效果 */
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  @keyframes softFloat {
    0% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
    100% { transform: translateY(0); }
  }
  
  article:hover time {
    animation: pulse 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  /* 轻交互效果 - 按钮点击反馈 */
  button:active, a[href="/rss.xml"]:active, #theme-toggle:active, .back-to-top:active {
    transform: scale(0.95);
  }
  
  /* 轻拟物化按钮样式 */
  #theme-toggle, .back-to-top, a[href="/rss.xml"] {
    border: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .dark #theme-toggle, .dark .back-to-top, .dark a[href="/rss.xml"] {
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  /* 额外的轻拟物元素样式 */
  .hover-float:hover {
    animation: softFloat 1.5s infinite ease-in-out;
  }

  .hover-scale:hover {
    transform: scale(1.03);
  }

  /* 优化图片加载动画 */
  .image-loading {
    transition: opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }

  .image-modal-content img.loaded + .image-loading {
    opacity: 0;
  }

  /* 图像加载效果 */
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  .image-placeholder {
    background: linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  .dark .image-placeholder {
    background: linear-gradient(90deg, #2d3748 25%, #374151 50%, #2d3748 75%);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  
  /* 浅色模式时间样式 */
  article time {
    text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.7);
  }
  
  /* 深色模式时间样式 */
  .dark article time {
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
  }
  
  /* 文章内容边框效果 */
  article section {
    border-radius: 12px;
    padding: 1rem 0;
    position: relative;
    z-index: 1;
  }
  
  /* 额外的动画效果 */
  .hover-float {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
`;

const clientScript = `
  (function() {
    function safeDomUpdate(callback) {
      requestAnimationFrame(callback);
    }

    // 初始化所有组件
    function initApp() {
      initThemeToggle();
      initBackToTop();
      initImageViewer();
      initHoverEffects();
      enhanceUIExperience();
    }

    // 主题切换功能
    function initThemeToggle() {
      const themeToggle = document.getElementById('theme-toggle');
      const themeIcon = document.getElementById('theme-icon');
      const html = document.documentElement;

      const THEMES = ['system', 'light', 'dark'];
      let currentThemeIndex = 0; // 0: system, 1: light, 2: dark

      const themeConfig = {
        'light': {
          icon: 'ri-sun-fill',
          label: '切换到深色模式',
          apply: () => { html.classList.remove('dark'); localStorage.theme = 'light'; }
        },
        'dark': {
          icon: 'ri-moon-fill',
          label: '切换到浅色模式',
          apply: () => { html.classList.add('dark'); localStorage.theme = 'dark'; }
        },
        'system': {
          icon: 'ri-contrast-fill',
          label: '切换到系统模式',
          apply: () => {
            localStorage.removeItem('theme');
            html.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
          }
        }
      };

      function updateThemeUI(theme) {
        const config = themeConfig[theme];
        themeIcon.className = \`\${config.icon} text-lg\`;
        themeToggle.setAttribute('aria-label', config.label);
      }

      function applyTheme(theme) {
        safeDomUpdate(() => {
          themeConfig[theme].apply();
          updateThemeUI(theme);
          currentThemeIndex = THEMES.indexOf(theme);
          // 添加主题切换动画
          document.body.classList.add('theme-transition');
          setTimeout(() => {
            document.body.classList.remove('theme-transition');
          }, 500);
        });
      }
        
      const storedTheme = localStorage.theme;
      if (storedTheme && THEMES.includes(storedTheme)) {
        applyTheme(storedTheme);
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          html.classList.add('dark');
        }
        updateThemeUI('system');
      }

      themeToggle.addEventListener('click', () => {
        currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
        const newTheme = THEMES[currentThemeIndex];
        applyTheme(newTheme);
        // 添加点击反馈动画
        themeToggle.classList.add('button-clicked');
        setTimeout(() => {
          themeToggle.classList.remove('button-clicked');
        }, 300);
      });

      const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemPreferenceChange = (event) => {
        if (!localStorage.theme) {
          safeDomUpdate(() => {
            html.classList.toggle('dark', event.matches);
          });
        }
      };
      mediaQueryList.addEventListener('change', handleSystemPreferenceChange);
    }

    // 返回顶部功能
    function initBackToTop() {
      const backToTopBtn = document.getElementById('back-to-top');
      if (!backToTopBtn) return;

      const pageTopSentinel = document.createElement('div');
      Object.assign(pageTopSentinel.style, {
        position: 'absolute', top: '0', left: '0', width: '1px', height: '1px', pointerEvents: 'none'
      });
      document.body.appendChild(pageTopSentinel);

      const observer = new IntersectionObserver((entries) => {
        safeDomUpdate(() => {
          backToTopBtn.classList.toggle('visible', !entries[0].isIntersecting);
        });
      }, {
        threshold: 0,
        rootMargin: '300px 0px 0px 0px'
      });

      observer.observe(pageTopSentinel);

      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 添加点击反馈动画
        backToTopBtn.classList.add('button-clicked');
        setTimeout(() => {
          backToTopBtn.classList.remove('button-clicked');
        }, 300);
      });
    }

    // 图片预览功能
    function initImageViewer() {
      const modal = document.getElementById('imageModal');
      const modalImg = document.getElementById('modalImage');
      const closeBtn = modal?.querySelector('.image-modal-close');
      const prevBtn = modal?.querySelector('.image-modal-prev');
      const nextBtn = modal?.querySelector('.image-modal-next');
      const loadingIndicator = modal?.querySelector('.image-loading');

      if (!modal || !modalImg || !closeBtn || !prevBtn || !nextBtn || !loadingIndicator) {
        console.warn('Image viewer elements not found. Skipping initialization.');
        return;
      }

      let currentArticleImages = [];
      let currentIndex = 0;
      let isModalActive = false;

      const lazyLoadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
              img.src = dataSrc;
              img.removeAttribute('data-src');
            }
            lazyLoadObserver.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });

      function loadImageIntoModal(imgElement) {
        loadingIndicator.style.display = 'flex';
        modalImg.classList.remove('loaded');
        
        // 隐藏所有控制按钮
        closeBtn.style.display = 'none';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';

        modalImg.src = imgElement.currentSrc || imgElement.src;
        modalImg.alt = imgElement.alt || '预览图片';

        modalImg.onload = null;
        modalImg.onerror = null;

        const handleLoad = () => {
          modalImg.classList.add('loaded');
          loadingIndicator.style.display = 'none';
          
          // 显示关闭按钮
          closeBtn.style.display = 'flex';
          
          // 根据图片数量决定是否显示导航按钮
          const hasMultipleImages = currentArticleImages.length > 1;
          prevBtn.style.display = hasMultipleImages ? 'flex' : 'none';
          nextBtn.style.display = hasMultipleImages ? 'flex' : 'none';
        };

        const handleError = () => {
          loadingIndicator.style.display = 'none';
          
          // 显示加载失败消息
          modalImg.style.display = 'none';
          console.error('图片加载失败');
          
          // 显示关闭按钮，允许用户关闭模态窗
          closeBtn.style.display = 'flex';
        };

        modalImg.addEventListener('load', handleLoad, { once: true });
        modalImg.addEventListener('error', handleError, { once: true });
      }

      function openModal(imgElement, articleImages) {
        isModalActive = true;
        
        // 查找当前图片在文章所有图片中的索引
        currentArticleImages = articleImages;
        currentIndex = Array.from(articleImages).indexOf(imgElement);
        
        // 打开模态窗
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        loadImageIntoModal(imgElement);
        
        // 添加按键事件监听
        document.addEventListener('keydown', handleKeyDown);
      }

      function closeModal() {
        isModalActive = false;
        
        // 关闭模态窗
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // 清理事件监听
        document.removeEventListener('keydown', handleKeyDown);
        
        // 重置图片
        modalImg.src = '';
        modalImg.classList.remove('loaded');
      }

      function showPreviousImage() {
        if (currentArticleImages.length <= 1) return;
        
        currentIndex = (currentIndex - 1 + currentArticleImages.length) % currentArticleImages.length;
        loadImageIntoModal(currentArticleImages[currentIndex]);
        
        // 添加动画效果
        modalImg.classList.add('slide-right');
        setTimeout(() => modalImg.classList.remove('slide-right'), 300);
      }

      function showNextImage() {
        if (currentArticleImages.length <= 1) return;
        
        currentIndex = (currentIndex + 1) % currentArticleImages.length;
        loadImageIntoModal(currentArticleImages[currentIndex]);
        
        // 添加动画效果
        modalImg.classList.add('slide-left');
        setTimeout(() => modalImg.classList.remove('slide-left'), 300);
      }

      function handleKeyDown(event) {
        if (!isModalActive) return;
        
        switch (event.key) {
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
      }

      // 为所有文章中的图片添加点击事件
      function setupPreviewForImages() {
        const articles = document.querySelectorAll('article');
        
        articles.forEach(article => {
          const images = article.querySelectorAll('img[data-preview="true"]');
          
          images.forEach(img => {
            // 处理图片加载完成的事件
            img.addEventListener('load', () => {
              const container = img.parentElement;
              img.classList.add('loaded');
              if (container) container.classList.add('loaded');
            });
            
            // 添加点击事件处理
            img.addEventListener('click', (event) => {
              event.preventDefault();
              openModal(img, images);
            });
          });
        });
      }

      // 为模态窗按钮添加事件处理
      closeBtn.addEventListener('click', closeModal);
      prevBtn.addEventListener('click', showPreviousImage);
      nextBtn.addEventListener('click', showNextImage);
      
      // 点击模态窗背景关闭
      modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
      });

      // 初始化预览
      setupPreviewForImages();
    }

    // 添加微交互效果
    function initHoverEffects() {
      // 为文章时间添加悬浮效果
      const times = document.querySelectorAll('article time');
      times.forEach(time => {
        time.classList.add('hover-scale');
      });
      
      // 为按钮添加轻微的悬浮效果
      const buttons = document.querySelectorAll('#theme-toggle, a[href="/rss.xml"], .back-to-top');
      buttons.forEach(btn => {
        btn.classList.add('hover-float');
      });
    }

    // 增强UI体验
    function enhanceUIExperience() {
      // 根据滚动位置添加平滑阴影效果
      const mainSection = document.querySelector('section');
      if (!mainSection) return;
      
      const handleScroll = () => {
        const scrollPosition = window.scrollY;
        const shadowIntensity = Math.min(scrollPosition / 100, 0.15);
        
        if (document.documentElement.classList.contains('dark')) {
          mainSection.style.boxShadow = \`0 10px 30px rgba(0, 0, 0, \${shadowIntensity + 0.05})\`;
        } else {
          mainSection.style.boxShadow = \`0 10px 30px rgba(0, 0, 0, \${shadowIntensity})\`;
        }
      };
      
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // 初始调用一次设置初始阴影
      
      // 为markdown内容中的链接添加平滑过渡效果
      const articleLinks = document.querySelectorAll('.article-content a, .prose a');
      articleLinks.forEach(link => {
        link.classList.add('transition-all', 'duration-300');
      });
    }

    // 在DOM加载完成后初始化所有功能
    document.addEventListener('DOMContentLoaded', initApp);
  })();
`;


