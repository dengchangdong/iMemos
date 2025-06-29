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
          <time datetime="${new Date(timestamp).toISOString()}" class="text-blue-600 dark:text-blue-400 font-poppins font-semibold block md:text-sm text-xs hover:text-blue-800 dark:hover:text-blue-300 transition-all hover:scale-105">${formattedTime}</time>
        </a>
      </div>
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

// 创建资源HTML
const renderImageItem = (resource, itemClass) => {
  const originalLink = resource.externalLink || '';
  const transformedLink = originalLink.replace(
    'images-memos.dengchangdong.com',
    'images-memos.dengchangdong.com/cdn-cgi/image/h=800'
  );

  return utils.createHtml`
    <div class="${itemClass} relative bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
      <img src="${transformedLink}" alt="${resource.filename || '图片'}" class="rounded-lg w-full h-full object-cover transition-all duration-300 absolute inset-0 z-10 hover:scale-105 opacity-0" loading="lazy" data-preview="true"/>
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
      container: 'flex flex-wrap gap-1', 
      item: 'w-[calc(50%-2px)] aspect-square' 
    },
    default: { 
      container: 'grid grid-cols-3 gap-1', 
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
    <figure class="mt-4">
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

  // 将内容数组转换为 fullPage.js 的 section 结构
  let articlesHtml;
  if (Array.isArray(content)) {
    articlesHtml = content.map(article => utils.createHtml`
      <div class="section">
        <div class="article-container">
          ${article}
        </div>
      </div>
    `).join('');
  } else {
    articlesHtml = utils.createHtml`
      <div class="section">
        <div class="article-container">
          ${content}
        </div>
      </div>
    `;
  }

  // 导航按钮放在最外层，与fullpage并列
  const navigationButtons = utils.createHtml`
    <div class="navigation-buttons">
      <a href="#" id="prev-page" class="nav-btn prev-btn">
        <i class="ri-arrow-left-s-line"></i> 上一页
      </a>
      <a href="#" id="next-page" class="nav-btn next-btn">
        下一页 <i class="ri-arrow-right-s-line"></i>
      </a>
    </div>
  `;

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
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/fullPage.js/4.0.20/fullpage.min.css">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
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
      <body class="min-h-screen m-0 p-0 font-sans">
        <!-- 固定在左上角的网站信息和控制按钮 -->
        <header class="fixed-header">
          <a href="/" class="site-title" aria-label="返回首页">${siteName}</a>
          <div class="control-buttons">
            <a href="/rss.xml" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-grey-200 dark:bg-blue-300/30 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none transition-all duration-200 shadow-sm transform hover:scale-110 hover:shadow-md active:scale-100 active:shadow-sm" aria-label="RSS订阅" title="RSS订阅">
              <i class="ri-rss-fill text-lg" aria-hidden="true"></i>
            </a>
            <button id="theme-toggle" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-grey-200 dark:bg-blue-300/30 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none transition-all duration-200 shadow-sm transform hover:scale-110 hover:shadow-md active:scale-100 active:shadow-sm" aria-label="切换主题">
              <i class="ri-sun-fill text-lg" id="theme-icon" aria-hidden="true"></i>
            </button>
          </div>
        </header>

        <!-- fullPage.js 主容器 -->
        <div id="fullpage">
          ${articlesHtml}
        </div>
        
        <!-- 导航按钮 -->
        ${navigationButtons}

        <!-- 图片预览模态框 -->
        <div 
          id="imageModal" 
          class="image-modal fixed inset-0 w-full h-full bg-black/90 z-[100] justify-center items-center opacity-0 transition-opacity duration-300 ease-in-out will-change-opacity hidden backdrop-blur-sm"
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

        <script src="https://cdnjs.cloudflare.com/ajax/libs/fullPage.js/4.0.20/fullpage.min.js"></script>
        <script>
          ${clientScript}
        </script>
      </body>
    </html>
  `;
}

const clientStyle = `
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
    background: rgba(0, 0, 0, 0.11);
    border-radius: 10px; 
  }

  html::-webkit-scrollbar-track:hover, 
  body::-webkit-scrollbar-track:hover,
  pre::-webkit-scrollbar-track:hover {
    background: rgba(0, 0, 0, 0);
    border-radius: 10px; 
  }
  
  /* 字体样式 */
  body {
    font-family: 'Noto Sans SC', sans-serif;
    letter-spacing: 0.015em;
    margin: 0;
    padding: 0;
    background: none !important; /* 移除全局背景 */
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Noto Sans SC', sans-serif;
  }
  
  /* fullPage.js 相关样式 */
  #fullpage {
    width: 100%;
    height: 100vh;
    position: relative;
  }
  
  /* 不同的背景色 */
  .section:nth-child(1) { background-color: #f2f2f2; }
  .section:nth-child(2) { background-color: #4BBFC3; }
  .section:nth-child(3) { background-color: #7BAABE; }
  .section:nth-child(4) { background-color: #ccddff; }
  .section:nth-child(5) { background-color: #cfd8dc; }
  .section:nth-child(6) { background-color: #7E8F7C; }
  .section:nth-child(7) { background-color: #90856B; }
  .section:nth-child(8) { background-color: #8FB98B; }
  .section:nth-child(9) { background-color: #BFB6AA; }
  .section:nth-child(10) { background-color: #7DB9DE; }
  
  .section {
    width: 100%;
    height: 100vh;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* 移除文章背景，增大文字大小 */
  .article-container {
    background: transparent;
    border-radius: 1rem;
    padding: 2rem;
    max-width: 800px;
    width: 90%;
    margin: 0 auto;
    transition: all 0.3s ease;
    max-height: 85vh;
    overflow-y: auto;
    font-size: 1.1rem;
    line-height: 1.7;
  }
  
  .dark .article-container {
    color: #e5e7eb;
  }
  
  .article-container article {
    border-left: none;
    margin-left: 0;
    padding-left: 0;
  }
  
  /* 导航按钮样式 */
  .navigation-buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
    width: 100%;
    padding: 0 1rem;
    position: absolute;
    left: 0;
    bottom: 2rem;
  }
  
  .nav-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(to right, #4e5ed3, #3854a7);
    color: white;
    border-radius: 2rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(78, 94, 211, 0.25);
  }
  
  .nav-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(78, 94, 211, 0.3);
  }
  
  .nav-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
    background: linear-gradient(to right, #a0a0a0, #787878);
    box-shadow: none;
    transform: none;
  }
  
  .prev-btn {
    margin-right: auto;
  }
  
  .next-btn {
    margin-left: auto;
  }
  
  /* fullPage.js 导航样式 */
  #fp-nav ul li a span, 
  .fp-slidesNav ul li a span {
    background: rgba(255, 255, 255, 0.7);
  }
  
  #fp-nav ul li a.active span, 
  .fp-slidesNav ul li a.active span {
    background: rgb(255, 255, 255);
    transform: scale(1.5);
  }
  
  .fp-watermark {
    display: none !important;
  }
  
  /* 固定在左上角的标题和控制按钮 */
  .fixed-header {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 100;
    display: flex;
    align-items: center;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 0.75rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .dark .fixed-header {
    background: rgba(31, 41, 55, 0.9);
  }
  
  .site-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    margin-right: 1rem;
    padding: 0;
    background-image: linear-gradient(to right, #4776E6, #8E54E9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .control-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  /* 响应式调整 */
  @media (max-width: 768px) {
    .article-container {
      padding: 1.5rem;
      width: 95%;
      font-size: 1rem;
    }
    
    .fixed-header {
      padding: 0.5rem;
    }
    
    .site-title {
      font-size: 1rem;
      margin-right: 0.5rem;
    }
    
    .control-buttons {
      gap: 0.25rem;
    }
    
    .navigation-buttons {
      padding: 0 0.5rem;
      bottom: 1rem;
    }
  }
  
  /* 链接过渡效果 */
  a {
    transition: color 0.3s ease;
    position: relative;
  }
  
  a:not(.pagination a):hover {
    text-decoration: none;
  }
  
  a:not(.pagination a):after {
    content: none;
  }
  
  /* 代码块优化 */
  .code-block {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    margin: 1.5em 0;
    overflow: hidden;
  }
  
  pre {
    border-radius: 8px;
    margin: 1.5em 0;
    box-shadow: none;
  }
  
  .code-header {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    box-shadow: none;
  }
  
  .code-header + pre {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    margin-top: 0;
    box-shadow: none;
  }
  
  .code-block pre {
    margin: 0;
  }
  
  code {
    font-family: 'Roboto Mono', monospace;
  }
  
  /* 页面加载动画 */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .article-container article {
    animation: fadeIn 0.6s ease-out;
    animation-fill-mode: both;
  }
  
  /* 文章内容样式优化 */
  .article-content {
    font-size: 1.15rem;
    line-height: 1.8;
  }
  
  .article-content h1, 
  .article-content h2, 
  .article-content h3 {
    margin-top: 1.5em;
    margin-bottom: 0.8em;
  }
  
  .article-content p {
    margin-bottom: 1.2em;
  }
`;

const clientScript = `
  (function() {
    function safeDomUpdate(callback) {
      requestAnimationFrame(callback);
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

    // 图片预览功能
    function initImageViewer() {
      const modal = document.getElementById('imageModal');
      const modalImg = document.getElementById('modalImage');
      const closeBtn = modal?.querySelector('.image-modal-close');
      const prevBtn = modal?.querySelector('.image-modal-prev');
      const nextBtn = modal?.querySelector('.image-modal-next');
      const loadingIndicator = modal?.querySelector('.image-loading');
      
      if (!modal || !modalImg) return;
      
      let currentGallery = [];
      let currentIndex = 0;
      
      // 加载图片
      function loadImage(src) {
        modalImg.style.opacity = '0';
        loadingIndicator.style.display = 'flex';
        
        modalImg.src = src;
        modalImg.onload = function() {
          setTimeout(() => {
            modalImg.style.opacity = '1';
            loadingIndicator.style.display = 'none';
          }, 200);
        };
        modalImg.onerror = function() {
          loadingIndicator.style.display = 'none';
          alert('图片加载失败');
        };
      }
      
      // 显示预览图片
      function showImagePreview(event) {
        if (event.target.tagName !== 'IMG' || !event.target.dataset.preview) return;
        
        // 阻止默认行为
        event.preventDefault();
        
        // 获取当前图片组
        const galleryContainer = event.target.closest('figure');
        if (galleryContainer) {
          currentGallery = Array.from(galleryContainer.querySelectorAll('img[data-preview]'));
          currentIndex = currentGallery.indexOf(event.target);
          
          // 显示/隐藏前后导航按钮
          prevBtn.style.display = currentGallery.length > 1 ? 'flex' : 'none';
          nextBtn.style.display = currentGallery.length > 1 ? 'flex' : 'none';
        } else {
          currentGallery = [event.target];
          currentIndex = 0;
          
          // 隐藏前后导航按钮
          prevBtn.style.display = 'none';
          nextBtn.style.display = 'none';
        }
        
        // 显示模态框
        modal.classList.remove('hidden');
        setTimeout(() => {
          modal.classList.add('active');
          loadImage(event.target.src);
        }, 10);
        
        // 显示关闭按钮
        closeBtn.classList.remove('hidden');
        closeBtn.style.display = 'block';
        
        // 阻止滚动
        document.body.style.overflow = 'hidden';
      }
      
      // 关闭预览
      function closeImagePreview() {
        modal.classList.remove('active');
        setTimeout(() => {
          modal.classList.add('hidden');
          modalImg.src = '';
        }, 300);
        
        document.body.style.overflow = '';
      }
      
      // 上一张图片
      function prevImage() {
        if (currentGallery.length <= 1) return;
        currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
        loadImage(currentGallery[currentIndex].src);
      }
      
      // 下一张图片
      function nextImage() {
        if (currentGallery.length <= 1) return;
        currentIndex = (currentIndex + 1) % currentGallery.length;
        loadImage(currentGallery[currentIndex].src);
      }
      
      // 绑定事件
      document.addEventListener('click', showImagePreview);
      closeBtn.addEventListener('click', closeImagePreview);
      prevBtn.addEventListener('click', prevImage);
      nextBtn.addEventListener('click', nextImage);
      
      // 键盘导航
      document.addEventListener('keydown', function(event) {
        if (modal.classList.contains('active')) {
          switch (event.key) {
            case 'Escape':
              closeImagePreview();
              break;
            case 'ArrowLeft':
              prevImage();
              break;
            case 'ArrowRight':
              nextImage();
              break;
          }
        }
      });
      
      // 点击模态框背景关闭
      modal.addEventListener('click', function(event) {
        if (event.target === modal) {
          closeImagePreview();
        }
      });
    }
    
    // 初始化 fullPage.js
    function initFullPage() {
      // 获取所有section元素
      const sections = document.querySelectorAll('.section');
      const sectionsCount = sections.length;
      
      // 初始化fullPage
      const fullPageInstance = new fullpage('#fullpage', {
        // 常规选项
        licenseKey: 'gplv3-license', // 使用GPL开源协议
        autoScrolling: true,
        scrollHorizontally: false,
        navigation: true,
        navigationPosition: 'right',
        showActiveTooltip: true,
        verticalCentered: true,
        
        // 使用CSS3转换
        css3: true,
        
        // 滚动速度
        scrollingSpeed: 700,
        
        // 滚动效果
        easingcss3: 'cubic-bezier(0.645, 0.045, 0.355, 1.000)',
        
        // 回调函数
        afterLoad: function(origin, destination, direction) {
          // 页面加载后更新导航按钮状态
          updateNavigationButtons(destination.index, sectionsCount);
        }
      });
      
      // 将fullPage实例存储在全局变量中
      window.fullPageInstance = fullPageInstance;
      
      // 初始化导航按钮
      initNavigationButtons(sectionsCount);
      
      return fullPageInstance;
    }
    
    // 初始化导航按钮
    function initNavigationButtons(sectionsCount) {
      const prevBtn = document.getElementById('prev-page');
      const nextBtn = document.getElementById('next-page');
      
      if (!prevBtn || !nextBtn) return;
      
      // 初始状态 - 禁用上一页按钮
      updateNavigationButtons(0, sectionsCount);
      
      prevBtn.addEventListener('click', function(e) {
        e.preventDefault();
        fullpage_api.moveSectionUp();
      });
      
      nextBtn.addEventListener('click', function(e) {
        e.preventDefault();
        fullpage_api.moveSectionDown();
      });
    }
    
    // 更新导航按钮状态
    function updateNavigationButtons(currentIndex, totalSections) {
      const prevBtn = document.getElementById('prev-page');
      const nextBtn = document.getElementById('next-page');
      
      if (!prevBtn || !nextBtn) return;
      
      // 在第一页时禁用上一页按钮
      if (currentIndex === 0) {
        prevBtn.classList.add('disabled');
      } else {
        prevBtn.classList.remove('disabled');
      }
      
      // 在最后一页时禁用下一页按钮
      if (currentIndex >= totalSections - 1) {
        nextBtn.classList.add('disabled');
      } else {
        nextBtn.classList.remove('disabled');
      }
    }
    
    // 延迟加载图片
    function lazyLoadImages() {
      const images = document.querySelectorAll('img[data-preview]');
      
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              
              img.onload = function() {
                safeDomUpdate(() => {
                  img.style.opacity = '1';
                  const placeholder = img.parentNode.querySelector('.image-placeholder');
                  if (placeholder) {
                    placeholder.style.display = 'none';
                  }
                });
              };
              
              img.src = img.src;
              observer.unobserve(img);
            }
          });
        }, { threshold: 0.1 });
        
        images.forEach((img) => {
          observer.observe(img);
        });
      } else {
        // 不支持 IntersectionObserver 的浏览器回退方案
        images.forEach((img) => {
          img.style.opacity = '1';
        });
      }
    }
    
    // 初始化所有功能
    function init() {
      initThemeToggle();
      initImageViewer();
      initFullPage();
      lazyLoadImages();
    }
    
    // 在DOM加载完成后初始化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
`;

