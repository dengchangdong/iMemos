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
function createArticleStructure(header, content, isHomePage = true) {
  const articleClass = isHomePage 
    ? "pb-8 border-l border-indigo-300 relative pl-5 ml-3 last:border-transparent last:pb-0 animate-fade-in" 
    : "pb-8 last:pb-0 single-article animate-fade-in";
  return utils.createHtml`
    <article class="${articleClass}">
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
          <time datetime="${new Date(timestamp).toISOString()}" class="text-blue-600 dark:text-blue-400 font-poppins font-semibold block md:text-sm text-xs hover:text-blue-800 dark:hover:text-blue-300 transition-all">${formattedTime}</time>
        </a>
      </div>
    `;
    
    // 创建文章内容
    const articleContent = utils.createHtml`
      ${parsedContent}
      ${resourcesHtml}
    `;
    
    return createArticleStructure(header, articleContent, isHomePage);
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
                  'custom-gradient': 'linear-gradient(45deg, #209cff, #68e0cf)',
                  'custom-gradient-dark': 'linear-gradient(45deg, #0f4c81, #2c7873)',
                },
                colors: {
                  'indigo-timeline': '#4e5ed3',
                  'indigo-shadow': '#bab5f8',
                  'blue-light-hover': '#0c7cd51c',
                },
                fontFamily: {
                  'sans': ['Noto Sans SC', 'sans-serif'],
                  'poppins': ['Poppins', 'sans-serif'],
                  'code': ['Roboto Mono', 'monospace'],
                },
                animation: {
                  'fade-in': 'fadeIn 0.6s ease-out forwards',
                  'fade-in-delay-1': 'fadeIn 0.6s ease-out 0.1s forwards',
                  'fade-in-delay-2': 'fadeIn 0.6s ease-out 0.2s forwards',
                  'fade-in-delay-3': 'fadeIn 0.6s ease-out 0.3s forwards',
                  'fade-in-delay-4': 'fadeIn 0.6s ease-out 0.4s forwards',
                },
                keyframes: {
                  fadeIn: {
                    'from': { opacity: 0, transform: 'translateY(10px)' },
                    'to': { opacity: 1, transform: 'translateY(0)' }
                  }
                },
                boxShadow: {
                  'article-dot': '3px 3px 0px #bab5f8',
                  'article-dot-hover': '4px 4px 0px #bab5f8',
                  'article-dot-dark': '3px 3px 0px #6366f1',
                  'article-dot-dark-hover': '4px 4px 0px #6366f1',
                  'img': '0 4px 10px rgba(0, 0, 0, 0.05)',
                  'code': '0 4px 12px rgba(0, 0, 0, 0.08)',
                },
                borderRadius: {
                  'code': '8px'
                },
                margin: {
                  'code': '1.5em 0'
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
          <section class="bg-white/95 dark:bg-gray-800/95 p-6 sm:p-12 rounded-xl shadow-lg w-full backdrop-blur-sm transition-all duration-300">
            <header class="flex items-center justify-between">
              <div class="flex items-center">
                <a href="/" class="flex items-center" aria-label="返回首页">
                  <h1 class="text-xl font-semibold font-poppins mb-0 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400">${siteName}</h1>
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
                <a href="/rss.xml" class="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-grey-200 dark:bg-blue-300 text-blue-500 hover:text-blue-700 dark:text-blue-700 dark:hover:text-blue-700 focus:outline-none focus:ring-0 focus:border-0 transition-all duration-200 shadow-sm transform hover:scale-110 hover:shadow-md active:scale-100 active:shadow-sm" aria-label="RSS订阅" title="RSS订阅">
                  <i class="ri-rss-fill text-lg" aria-hidden="true"></i>
                </a>
                <button id="theme-toggle" class="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-grey-200 dark:bg-blue-300 text-blue-500 hover:text-blue-700 dark:text-blue-700 dark:hover:text-blue-700 focus:outline-none focus:ring-0 focus:border-0 transition-all duration-200 shadow-sm transform hover:scale-110 hover:shadow-md active:scale-100 active:shadow-sm" aria-label="切换主题">
                  <i class="ri-sun-fill text-lg" id="theme-icon" aria-hidden="true"></i>
                </button>
              </div>
            </header>
            <main class="mt-8 sm:mt-10 relative animate-fade-in">
              ${articlesHtml}
            </main>
            
            <!-- 分页导航 -->
            ${renderPagination({ currentPage, hasMore, isHomePage, tag, memosCount, pageLimit })}
          </section>
        </div>

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
  /* 滚动条样式，无法用Tailwind替代 */
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
  
  /* article的before伪元素样式 - 无法完全用Tailwind替代 */
  article::before {
    content: '';
    width: 17px;
    height: 17px;
    background-color: white;
    border: 1px solid #4e5ed3;
    border-radius: 50%;
    position: absolute;
    left: -9px;
    top: 0;
    box-shadow: 3px 3px 0px #bab5f8;
    transition: all 0.3s ease;
  }
  
  /* 单篇文章不显示before伪元素和左侧间距 */
  .single-article::before {
    content: none;
  }
  
  .single-article {
    padding-left: 0 !important;
    margin-left: 0 !important;
  }
  
  .dark article::before {
    background-color: #1f2937;
    border-color: #818cf8;
    box-shadow: 3px 3px 0px #6366f1;
  }
  
  article:hover::before {
    transform: scale(1.1);
    box-shadow: 4px 4px 0px #bab5f8;
    background-color: #4e5ed3;
  }
  
  .dark article:hover::before {
    box-shadow: 4px 4px 0px #6366f1;
  }

  /* 模态框显示状态 */
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

  /* 图片加载状态 */
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
  
  /* 文章排序延迟动画 */
  article:nth-child(2) { animation-delay: 0.1s; }
  article:nth-child(3) { animation-delay: 0.2s; }
  article:nth-child(4) { animation-delay: 0.3s; }
  article:nth-child(5) { animation-delay: 0.4s; }
  
  /* Tailwind无法处理的特殊伪类选择器 */
  a:not(.pagination a):after {
    content: none;
  }
  
  /* 代码块样式 */
  .code-block {
    @apply rounded-code shadow-code my-code overflow-hidden;
  }
  
  pre {
    @apply rounded-code my-code shadow-none font-code;
  }
  
  .code-header {
    @apply rounded-t-code shadow-none;
  }
  
  .code-block pre {
    @apply m-0;
  }
  
  code {
    font-family: 'Roboto Mono', monospace;
  }
  
  .code-header + pre {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    margin-top: 0;
    box-shadow: none;
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
          // 不再需要调用updateNavigationButtons，因为这个逻辑已经在loadImageIntoModal中处理了
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

    // 增强的Markdown处理 (主要用于动态内容加载后的代码复制按钮初始化)
    function enhanceMarkdown() {
      const observer = new MutationObserver((mutations) => {
        let hasNewCodeBlocks = false;
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE && (node.querySelector('.code-block') || node.matches('.code-block'))) {
                hasNewCodeBlocks = true;
                break;
              }
            }
            if (hasNewCodeBlocks) break;
          }
        }
        if (hasNewCodeBlocks) {
          initCodeCopyButtons();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      initCodeCopyButtons();
    }

    // 页面加载完成后初始化所有功能
    document.addEventListener('DOMContentLoaded', () => {
      initThemeToggle();
      initImageViewer();
      enhanceMarkdown(); // Handles code copy buttons

      if ('requestIdleCallback' in window) {
        requestIdleCallback(initBackToTop);
      } else {
        setTimeout(initBackToTop, 200);
      }
    });
  })();
`;

