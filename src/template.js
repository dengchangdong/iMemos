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
      utils.createHtml`
        <div class="article-content text-white">
          <time class="memo-time">错误</time>
          <p class="text-red-400 dark:text-red-400 font-medium">加载失败</p>
          <p class="text-sm text-white">${error.message}</p>
          <p class="mt-4"><a href="/" class="text-white/70 hover:text-white dark:hover:text-white">返回首页</a></p>
        </div>
      `
    );
  },
  
  /**
   * 404页面模板
   * @returns {string} 404页面HTML
   */
  notFoundPage() {
    return createArticleStructure(
      utils.createHtml`
        <div class="article-content text-white">
          <time class="memo-time">404</time>
          <h2 class="font-medium text-white">未找到内容</h2>
          <p class="text-white">您访问的内容不存在或已被删除</p>
          <p class="mt-4"><a href="/" class="text-white/70 hover:text-white dark:hover:text-white">返回首页</a></p>
        </div>
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
function createArticleStructure(content) {
  return utils.createHtml`
    <article class="pb-8 relative pl-5 last:pb-0 flex flex-col justify-center items-center h-full">
      <section class="leading-relaxed md:text-base text-sm max-w-3xl mx-auto px-6 article-section">
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
    
    // 创建文章内容
    const articleContent = utils.createHtml`
      <div class="article-content text-white">
        <time datetime="${new Date(timestamp).toISOString()}" class="memo-time">${formattedTime}</time>
        ${parsedContent}
        ${resourcesHtml}
      </div>
    `;
    
    return createArticleStructure(articleContent);
  } catch (error) {
    console.error('渲染 memo 失败:', error)
    return createArticleStructure(
      utils.createHtml`<div class="article-content text-white">
        <p class="text-red-500 dark:text-red-400">渲染失败: ${error.message}</p>
      </div>`
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

  const buttonClass = "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-white/50 dark:bg-white/50 text-gray-800 hover:bg-black/50 hover:text-white shadow-md";

  if (isHomePage && currentPage === 1) {
    return utils.createHtml`
      <div class="pagination flex justify-center items-center">
        <a href="/page/2" class="${buttonClass} fixed right-5 bottom-5">
          查看更多 <i class="ri-arrow-right-line text-xl ml-2"></i>
        </a>
      </div>
    `;
  }

  const prevPageLink = currentPage > 2 ? `/page/${currentPage - 1}` : '/';
  const nextPageLink = `/page/${currentPage + 1}`;

  return utils.createHtml`
    <div class="pagination">
      <a href="${prevPageLink}" class="${buttonClass}">
        <i class="ri-arrow-left-line text-xl mr-2"></i> 上一页
      </a>
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
                  'custom-gradient-1': 'linear-gradient(128deg,#ff9a3f,#ff4b40)',
                  'custom-gradient-2': 'linear-gradient(128deg,#40afff,#3f61ff)',
                },
                colors: {
                  'indigo-timeline': '#4e5ed3',
                  'indigo-shadow': '#bab5f8',
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
      <body class="min-h-screen m-0 p-0 font-sans">
        <header class="fixed top-0 left-0 z-50 p-4 flex items-center">
          <a href="/" class="flex items-center mr-4 bg-white/50 dark:bg-white/50 text-gray-800 hover:bg-black/50 hover:text-white px-4 py-2 rounded-full transition-all duration-300" aria-label="返回首页">
            <h1 class="text-base font-semibold font-poppins mb-0 tracking-wide">${siteName}</h1>
          </a>
          <a href="/rss.xml" class="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 dark:bg-white/50 text-gray-800 hover:bg-black/50 hover:text-white focus:outline-none focus:ring-0 focus:border-0 transition-all duration-200 mr-2" aria-label="RSS订阅" title="RSS订阅">
            <i class="ri-rss-fill text-lg" aria-hidden="true"></i>
          </a>
          <button id="theme-toggle" class="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 dark:bg-white/50 text-gray-800 hover:bg-black/50 hover:text-white focus:outline-none focus:ring-0 focus:border-0 transition-all duration-200" aria-label="切换主题">
            <i class="ri-sun-fill text-lg" id="theme-icon" aria-hidden="true"></i>
          </button>
        </header>
        
        <div id="custom-fullpage">
          ${articlesHtml}
        </div>

        <!-- 分页导航 -->
        ${hasMore ? renderPagination({ currentPage, hasMore, isHomePage, tag, memosCount, pageLimit }) : ''}
        
        <button 
          id="back-to-top" 
          class="back-to-top fixed bottom-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md cursor-pointer z-50 opacity-0 invisible transition-all duration-300 ease-in-out transform hover:from-blue-600 hover:to-blue-700 hover:scale-110 hover:shadow-lg"
          aria-label="返回顶部"
        >
          <i class="ri-arrow-up-line text-xl" aria-hidden="true"></i>
        </button>
        
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
  
  /* 新增字体样式 */
  body {
    font-family: 'Noto Sans SC', sans-serif;
    letter-spacing: 0.015em;
    overflow-x: hidden;
    overflow-y: hidden;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Noto Sans SC', sans-serif;
  }
  
  /* 改进阴影效果 */
  .shadow-lg {
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 
                0 8px 10px -6px rgba(0, 0, 0, 0.03);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
  }
  
  .shadow-lg:hover {
    box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.1), 
                0 10px 20px -5px rgba(0, 0, 0, 0.07);
  }
  
  /* 文章样式与动画 */
  article {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    position: relative;
    height: 100vh;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    scroll-snap-align: start;
    overflow-y: auto;
    padding: 2rem 0;
  }
  
  article section {
    max-height: 90vh;
    overflow-y: auto;
    padding: 1rem;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.3) transparent;
  }
  
  article section::-webkit-scrollbar {
    width: 5px;
  }
  
  article section::-webkit-scrollbar-track {
    background: transparent;
  }
  
  article section::-webkit-scrollbar-thumb {
    background-color: rgba(255,255,255,0.3);
    border-radius: 10px;
  }
  
  /* 按钮动画效果 */
  button, .pagination a {
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  }
  
  button:hover, .pagination a:hover{
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  button:active, .pagination a:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

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

  .article-content img, .mt-4 img {
    cursor: pointer;
    transition: opacity 0.3s ease, transform 0.3s ease;
    background-color: #0c7cd51c;
    opacity: 0.5;
    will-change: opacity, transform;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  }

  .article-content img.loaded, .mt-4 img.loaded {
    opacity: 1;
  }

  .article-content img:hover, .mt-4 img:hover {
    opacity: 0.95;
    transform: scale(1.01);
  }

  .image-placeholder {
    opacity: 1;
    transition: opacity 0.3s ease;
    will-change: opacity;
  }

  div.loaded .image-placeholder {
    opacity: 0;
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
  
  /* 分页导航 */
  .pagination {
    position: fixed;
    z-index: 100;
  }
  
  .pagination a:first-child {
    left: 20px;
    bottom: 20px;
    position: fixed;
  }
  
  .pagination a:last-child {
    right: 20px;
    bottom: 20px;
    position: fixed;
  }
  
  /* 自定义全屏效果 */
  #custom-fullpage {
    height: 100vh;
    width: 100vw;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
  }
  
  /* 文章section滚动样式 */
  .article-section {
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.3) transparent;
    padding-right: 10px;
  }
  
  /* 确保文章内容在滚动时不被遮挡 */
  .article-content {
    color: #fff !important;
    width: 100%;
    position: relative;
    padding-bottom: 2rem;
  }
  
  .article-content p,
  .article-content h1,
  .article-content h2,
  .article-content h3,
  .article-content h4,
  .article-content h5,
  .article-content h6,
  .article-content ul,
  .article-content ol,
  .article-content li,
  .article-content a,
  .article-content blockquote,
  .article-content pre,
  .article-content code {
    color: #fff !important;
  }
  
  article:nth-child(odd) {
    background: linear-gradient(128deg,#ff9a3f,#ff4b40);
  }
  
  article:nth-child(even) {
    background: linear-gradient(128deg,#40afff,#3f61ff);
  }
  
  .dark article {
    background: #555;
  }
  
  /* 文章发布日期样式 */
  .memo-time {
    position: fixed;
    left: 5vw;
    top: 50%;
    transform: translateY(-50%);
    font-size: clamp(2rem, 5vw, 4rem);
    color: rgba(255,255,255,0.3);
    font-weight: bold;
    writing-mode: vertical-lr;
    text-orientation: mixed;
    opacity: 0.8;
    font-family: 'Poppins', sans-serif;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    .memo-time {
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      left: 2vw;
    }
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
          closeBtn.style.display = 'flex'; // 图片加载错误时也显示关闭按钮
          console.error('Modal image failed to load:', modalImg.src);
        };

        if (modalImg.complete && modalImg.naturalWidth > 0) {
          handleLoad();
        } else {
          modalImg.onload = handleLoad;
          modalImg.onerror = handleError;
        }
      }

      function updateNavigationButtons() {
        const hasMultipleImages = currentArticleImages.length > 1;
        safeDomUpdate(() => {
          prevBtn.style.display = hasMultipleImages ? 'flex' : 'none';
          nextBtn.style.display = hasMultipleImages ? 'flex' : 'none';
        });
      }

      function showImageInModal(img, index) {
        if (isModalActive) return;

        isModalActive = true;
        currentIndex = index;

        safeDomUpdate(() => {
          loadImageIntoModal(img);
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
        });
      }

      function navigateImages(direction) { 
        if (currentArticleImages.length <= 1) return;

        currentIndex = (currentIndex + direction + currentArticleImages.length) % currentArticleImages.length;
        const targetImg = currentArticleImages[currentIndex];

        if (targetImg) {
          loadImageIntoModal(targetImg);
        }
      }

      function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        isModalActive = false;
        
        // 关闭模态框时隐藏所有控制按钮
        closeBtn.style.display = 'none';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';

        currentArticleImages = [];
        currentIndex = 0;
      }

      function getAllPreviewImages() {
        return Array.from(document.querySelectorAll('[data-preview="true"]'));
      }

      function getImagesInContext(triggerImg) {
        const article = triggerImg.closest('article');
        return article ? Array.from(article.querySelectorAll('[data-preview="true"]')) : getAllPreviewImages();
      }

      function setupPageImages() {
        getAllPreviewImages().forEach(img => {
          if (!img.dataset.src && img.src && !img.src.startsWith('data:image/svg+xml')) {
            img.setAttribute('data-src', img.src);
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
          }
          lazyLoadObserver.observe(img);

          if (!img.classList.contains('loaded')) {
            const handleLoad = () => {
              if (img.complete && img.naturalWidth > 0) {
                img.classList.add('loaded');
                if (img.parentNode) img.parentNode.classList.add('loaded');
              }
              img.removeEventListener('load', handleLoad); 
              img.removeEventListener('error', handleError);
            };
            const handleError = () => {
              console.error('Image failed to load:', img.src);
              img.removeEventListener('load', handleLoad);
              img.removeEventListener('error', handleError);
            };

            if (img.complete) {
              if (img.naturalWidth > 0) {
                handleLoad();
              } else {
                handleError();
              }
            } else {
              img.addEventListener('load', handleLoad);
              img.addEventListener('error', handleError);
            }
          }
        });
      }

      closeBtn.addEventListener('click', closeModal);
      prevBtn.addEventListener('click', () => navigateImages(-1));
      nextBtn.addEventListener('click', () => navigateImages(1));

      modal.addEventListener('click', (e) => {
        if (e.target === modal) { // Clicked on modal background
          closeModal();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        switch(e.key) {
          case 'Escape': closeModal(); break;
          case 'ArrowLeft': navigateImages(-1); break;
          case 'ArrowRight': navigateImages(1); break;
        }
      });

      document.addEventListener('click', (e) => {
        const targetImg = e.target.closest('[data-preview="true"]');
        if (targetImg) {
          e.preventDefault();
          currentArticleImages = getImagesInContext(targetImg);
          const index = currentArticleImages.indexOf(targetImg);
          if (index !== -1) {
            showImageInModal(targetImg, index);
          }
        }
      }, { passive: false });

      const observer = new MutationObserver((mutations) => {
        let hasNewPreviewImages = false;
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE && (node.querySelector('[data-preview="true"]') || node.matches('[data-preview="true"]'))) {
                hasNewPreviewImages = true;
                break;
              }
            }
            if (hasNewPreviewImages) break;
          }
        }
        if (hasNewPreviewImages) {
          setupPageImages();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setupPageImages();
    }

    // 初始化代码复制功能
    function initCodeCopyButtons() {
      // Helper to update button state after copy operation
      function updateCopyButtonUI(button, success) {
        button.innerHTML = success ? '<i class="ri-check-line"></i>' : '<i class="ri-error-warning-line"></i>';
        button.classList.add('copied');
        setTimeout(() => {
          button.innerHTML = '<i class="ri-file-copy-line"></i>';
          button.classList.remove('copied');
        }, 2000);
      }

      document.querySelectorAll('.code-block').forEach(block => {
        const button = block.querySelector('.copy-btn');
        if (!button) return;

        if (button.dataset.hasCopyListener === 'true') return;
        button.dataset.hasCopyListener = 'true';

        button.addEventListener('click', () => {
          const originalCode = block.getAttribute('data-original-code');
          const codeText = originalCode ? decodeURIComponent(originalCode) : (block.querySelector('code')?.textContent || '');

          navigator.clipboard.writeText(codeText)
            .then(() => updateCopyButtonUI(button, true))
            .catch(() => {
              const textarea = document.createElement('textarea');
              textarea.value = codeText;
              Object.assign(textarea.style, {
                position: 'fixed', opacity: '0', top: '0', left: '0' 
              });
              document.body.appendChild(textarea);
              textarea.select();

              try {
                const successful = document.execCommand('copy');
                updateCopyButtonUI(button, successful);
              } catch (err) {
                console.error('Failed to copy via execCommand:', err);
                updateCopyButtonUI(button, false);
              } finally {
                document.body.removeChild(textarea);
              }
            });
        });
      });
    }

    // 自定义全屏滚动效果
    function initCustomFullPage() {
      const container = document.getElementById('custom-fullpage');
      if (!container) return;

      const articles = Array.from(container.querySelectorAll('article'));
      if (articles.length === 0) return;
      
      // 设置每个文章为独立的section
      articles.forEach((article, index) => {
        article.dataset.index = index;
        article.id = 'article-' + index;
      });
      
      let currentIndex = 0;
      let isScrolling = false;
      let touchStartY = 0;
      let touchDeltaY = 0;
      
      // 滚动到指定位置
      function scrollToArticle(index) {
        if (index < 0) index = 0;
        if (index >= articles.length) index = articles.length - 1;
        
        currentIndex = index;
        const targetArticle = articles[index];
        
        isScrolling = true;
        container.scrollTo({
          top: targetArticle.offsetTop,
          behavior: 'smooth'
        });
        
        // 动画完成后重置滚动标志
        setTimeout(() => {
          isScrolling = false;
        }, 1000);
      }
      
      // 滚动监听
      const handleScroll = throttle(() => {
        if (isScrolling) return;
        
        const scrollPosition = container.scrollTop;
        const windowHeight = window.innerHeight;
        
        let newIndex = 0;
        for (let i = 0; i < articles.length; i++) {
          const article = articles[i];
          const articleTop = article.offsetTop;
          const articleBottom = articleTop + article.offsetHeight;
          
          if (scrollPosition >= articleTop - windowHeight / 3 && 
              scrollPosition < articleBottom - windowHeight / 3) {
            newIndex = i;
            break;
          }
        }
        
        if (newIndex !== currentIndex) {
          currentIndex = newIndex;
        }
      }, 100);
      
      // 键盘导航
      function handleKeyDown(e) {
        // 如果当前正在内容区域滚动，不处理页面滚动
        if (isScrollingInArticle()) return;
        
        if (isScrolling) return;
        
        switch(e.key) {
          case 'ArrowUp':
          case 'PageUp':
            e.preventDefault();
            scrollToArticle(currentIndex - 1);
            break;
          case 'ArrowDown':
          case 'PageDown':
          case ' ':
            e.preventDefault();
            scrollToArticle(currentIndex + 1);
            break;
          case 'Home':
            e.preventDefault();
            scrollToArticle(0);
            break;
          case 'End':
            e.preventDefault();
            scrollToArticle(articles.length - 1);
            break;
        }
      }
      
      // 检查是否在文章内容区域滚动
      function isScrollingInArticle() {
        const currentArticle = articles[currentIndex];
        if (!currentArticle) return false;
        
        const section = currentArticle.querySelector('.article-section');
        if (!section) return false;
        
        // 如果内容高度大于容器高度，且未滚动到底部或顶部，则认为在内容区域滚动
        return section.scrollHeight > section.clientHeight && 
               (section.scrollTop > 0 && section.scrollTop + section.clientHeight < section.scrollHeight);
      }
      
      // 鼠标滚轮事件
      function handleWheel(e) {
        // 检查事件目标是否在文章内容区域
        const section = e.target.closest('.article-section');
        if (section) {
          // 检查内容是否可滚动
          const isScrollable = section.scrollHeight > section.clientHeight;
          
          // 如果内容可滚动，检查是否已经到达顶部或底部
          if (isScrollable) {
            const reachedTop = section.scrollTop === 0 && e.deltaY < 0;
            const reachedBottom = section.scrollTop + section.clientHeight >= section.scrollHeight - 1 && e.deltaY > 0;
            
            // 如果没有到达边界，让内容自然滚动
            if (!reachedTop && !reachedBottom) {
              return; // 不阻止默认行为，让内容区域自然滚动
            }
          }
        }
        
        // 如果不在内容区域或已到达内容边界，处理页面滚动
        if (isScrolling) {
          e.preventDefault();
          return;
        }
        
        const delta = Math.sign(e.deltaY);
        if (delta > 0) {
          scrollToArticle(currentIndex + 1);
        } else if (delta < 0) {
          scrollToArticle(currentIndex - 1);
        }
        
        e.preventDefault();
      }
      
      // 触摸事件处理
      function handleTouchStart(e) {
        touchStartY = e.touches[0].clientY;
      }
      
      function handleTouchMove(e) {
        // 检查是否在文章内容区域滚动
        const section = e.target.closest('.article-section');
        if (section) {
          // 检查内容是否可滚动
          const isScrollable = section.scrollHeight > section.clientHeight;
          
          if (isScrollable) {
            // 让内容自然滚动
            return;
          }
        }
        
        if (isScrolling) {
          e.preventDefault();
          return;
        }
        
        touchDeltaY = touchStartY - e.touches[0].clientY;
      }
      
      function handleTouchEnd() {
        // 检查是否在文章内容区域
        if (document.activeElement.closest('.article-section')) {
          return;
        }
        
        if (Math.abs(touchDeltaY) > 50) {
          if (touchDeltaY > 0) {
            scrollToArticle(currentIndex + 1);
          } else {
            scrollToArticle(currentIndex - 1);
          }
        }
        
        touchStartY = 0;
        touchDeltaY = 0;
      }
      
      // 节流函数
      function throttle(func, limit) {
        let inThrottle;
        return function() {
          const args = arguments;
          const context = this;
          if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        }
      }
      
      // 添加事件监听
      container.addEventListener('scroll', handleScroll, { passive: true });
      document.addEventListener('keydown', handleKeyDown);
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
      
      // 处理文章中的时间元素
      articles.forEach(article => {
        const timeElement = article.querySelector('.memo-time');
        if (timeElement) {
          // 确保时间元素位于视口左侧边缘
          timeElement.style.position = 'fixed';
          timeElement.style.left = '5vw';
          timeElement.style.opacity = '0';
          
          // 当文章进入视图时显示对应的时间元素
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                timeElement.style.opacity = '0.8';
              } else {
                timeElement.style.opacity = '0';
              }
            });
          }, { threshold: 0.5 });
          
          observer.observe(article);
        }
      });
    }
  
    // 页面加载完成后初始化所有功能
    document.addEventListener('DOMContentLoaded', () => {
      initThemeToggle();
      initImageViewer();
      initCodeCopyButtons();
      initBackToTop();
      initCustomFullPage();
    });
  })();
`;

