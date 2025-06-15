import { html } from 'hono/html';
import { CONFIG } from './config.js';
import { utils } from './utils.js';
import { simpleMarkdown } from './markdown.js'; // Ensure markdown is correctly imported and used

// --- 辅助函数：简化HTML结构和内容 ---

/**
 * 创建统一的文章结构HTML。
 * @param {string} headerHtml - 文章头部的HTML内容。
 * @param {string} contentHtml - 文章内容的HTML内容。
 * @returns {string} 完整的文章HTML结构。
 */
function createArticleStructure(headerHtml, contentHtml) {
  return utils.createHtml`
    <article class="
      pb-8 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0
      
      before:content-[''] before:w-[17px] before:h-[17px] before:bg-white
      before:border before:border-[#4e5ed3] before:rounded-full before:absolute
      before:left-[-10px] before:top-0 before:shadow-[3px_3px_0px_#bab5f8]

      dark:before:bg-[#1f2937] dark:before:border-[#818cf8] dark:before:shadow-[3px_3px_0px_#6366f1]
    ">
      <header>${headerHtml}</header>
      <section class="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 md:text-base text-sm article-content">
        ${contentHtml}
      </section>
    </article>
  `;
}

/**
 * 创建一个通用的信息/错误页面内容。
 * @param {string} timeText - 时间或状态文本 (如 "错误", "404")。
 * @param {string} titleText - 标题文本。
 * @param {string} messageText - 消息文本。
 * @param {string} [linkText='返回首页'] - 链接文本。
 * @param {string} [linkHref='/'] - 链接地址。
 * @returns {string} 可直接传入 createArticleStructure 的内容HTML。
 */
function createInfoPageContent(timeText, titleText, messageText, linkText = '返回首页', linkHref = '/') {
  const timeHtml = utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">${timeText}</time>`;
  const contentHtml = utils.createHtml`
    <h2 class="font-medium">${titleText}</h2>
    <p>${messageText}</p>
    <p class="mt-4"><a href="${linkHref}" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">${linkText}</a></p>
  `;
  return createArticleStructure(timeHtml, contentHtml);
}

// --- HTML模板集 ---
export const htmlTemplates = {
  /**
   * 错误页面模板。
   * @param {Error} error - 错误对象。
   * @returns {string} 渲染后的错误页面HTML。
   */
  errorPage(error) {
    return createInfoPageContent(
      '错误',
      `<span class="text-red-600 dark:text-red-400">加载失败</span>`,
      error.message
    );
  },

  /**
   * 404页面模板。
   * @returns {string} 渲染后的404页面HTML。
   */
  notFoundPage() {
    return createInfoPageContent(
      '404',
      '未找到内容',
      '您访问的内容不存在或已被删除'
    );
  }
};


// --- 导航链接解析 ---
/**
 * 解析导航链接字符串为对象数组。
 * @param {string} linksStr - 导航链接的JSON字符串（键为文本，值为URL）。
 * @returns {Array<{text: string, url: string}>} 解析后的链接数组。
 */
export function parseNavLinks(linksStr) {
  if (!linksStr) return [];
  try {
    // 假设 linksStr 已经是有效的 JSON 字符串，或尝试修复单引号为双引号
    const jsonStr = linksStr.replace(/'/g, '"');
    const linksObj = JSON.parse(jsonStr);
    return Object.entries(linksObj).map(([text, url]) => ({ text, url }));
  } catch (error) {
    console.error('解析导航链接失败:', error);
    return [];
  }
}

// --- 资源图片渲染 ---

/**
 * 根据资源数量和布局配置渲染单个图片项。
 * @param {object} resource - 图片资源对象。
 * @param {string} itemClass - 应用于图片容器的CSS类。
 * @returns {string} 单个图片项的HTML。
 */
const renderImageItem = (resource, itemClass) => utils.createHtml`
  <div class="${itemClass} relative bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden">
    <img 
      src="${resource.externalLink || ''}" 
      alt="${resource.filename || '图片'}"
      class="rounded-lg w-full h-full object-cover hover:opacity-95 transition-opacity absolute inset-0 z-10"
      loading="lazy"
      data-preview="true"
    />
    <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 image-placeholder">
      <i class="ri-image-line text-2xl"></i>
    </div>
  </div>
`;

/**
 * 根据图片数量创建图片网格HTML。
 * @param {Array<object>} resources - 图片资源数组。
 * @returns {string} 渲染后的图片网格HTML，如果无图片则返回空字符串。
 */
function createResourcesHtml(resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return '';
  }

  const count = resources.length;
  // 使用 Map 或 Object.freeze() 来确保配置不变
  const layoutConfig = Object.freeze({
    1: { container: '', item: 'w-full aspect-video' },
    2: { container: 'flex flex-wrap gap-1', item: 'w-[calc(50%-2px)] aspect-square' },
    // 默认值用于3张及以上
    default: { container: 'grid grid-cols-3 gap-1', item: 'aspect-square' },
  });

  const { container: containerClass, item: itemClass } =
    layoutConfig[count] || layoutConfig.default;

  const imagesHtml = resources
    .map(resource => renderImageItem(resource, itemClass))
    .join('');

  // 如果没有容器类，则直接返回图片HTML，避免多余的div
  const content = containerClass
    ? utils.createHtml`<div class="${containerClass}">${imagesHtml}</div>`
    : imagesHtml;

  return utils.createHtml`
    <figure class="mt-4">
      ${content}
    </figure>
  `;
}

// --- 单个 Memo 渲染 ---

/**
 * 渲染单个 memo 为文章结构。
 * @param {object} memo - memo 对象。
 * @param {boolean} [isHomePage=false] - 是否在首页显示，用于判断文章链接。
 * @returns {string} 渲染后的 memo HTML。
 */
export function renderMemo(memo, isHomePage = false) {
  try {
    const timestamp = memo.createTime
      ? new Date(memo.createTime).getTime()
      : (typeof memo.createdTs === 'number' ? memo.createdTs * 1000 : 0);

    const formattedTime = utils.formatTime(timestamp);
    const content = memo.content || '';
    const parsedContent = simpleMarkdown(content); // Use the simpleMarkdown from this module
    const resources = memo.resources || memo.resourceList || [];

    const resourcesHtml = createResourcesHtml(resources);
    const articleUrl = isHomePage && memo.name ? `/post/${memo.name}` : '#';

    const header = utils.createHtml`
      <a href="${articleUrl}" class="block">
        <time datetime="${new Date(timestamp).toISOString()}" class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">${formattedTime}</time>
      </a>
    `;

    const articleContent = utils.createHtml`
      ${parsedContent}
      ${resourcesHtml}
    `;

    return createArticleStructure(header, articleContent);
  } catch (error) {
    console.error('渲染 memo 失败:', error);
    // 渲染失败时，返回一个带有错误信息的 memo 结构
    return createArticleStructure(
      utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">渲染错误</time>`,
      utils.createHtml`<p class="text-red-500 dark:text-red-400">渲染失败: ${error.message}</p>`
    );
  }
}

// --- 分页导航渲染 ---

/**
 * 渲染分页导航部分。
 * @param {object} options - 分页选项。
 * @param {number} options.currentPage - 当前页码。
 * @param {boolean} options.hasMore - 是否有更多页。
 * @param {boolean} options.isHomePage - 是否是首页。
 * @param {string} [options.tag=''] - 标签名称，如果存在则用于标签分页。
 * @returns {string} 渲染后的分页导航HTML。
 */
function renderPagination({ currentPage, hasMore, isHomePage, tag = '' }) {
  // 如果不是列表页或没有更多内容，则不显示分页
  if (!isHomePage && !tag && !hasMore && currentPage === 1) {
    return ''; // 无需分页
  }

  const buttonClass = "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-blue-500 text-white no-underline border-none cursor-pointer hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow";
  const disabledButtonClass = "opacity-50 cursor-not-allowed hover:bg-blue-500 hover:-translate-y-0 hover:shadow-none";

  let prevLink = '';
  let nextLink = '';

  if (tag) {
    // 标签页分页
    prevLink = currentPage > 1 ? `/tag/${tag}?page=${currentPage - 1}` : `/tag/${tag}`;
    nextLink = `/tag/${tag}?page=${currentPage + 1}`;
  } else {
    // 主页/普通分页
    prevLink = currentPage > 2 ? `/page/${currentPage - 1}` : '/';
    nextLink = `/page/${currentPage + 1}`;
  }

  const prevButton = utils.createHtml`
    <a href="${prevLink}" class="${buttonClass} ${currentPage === 1 ? disabledButtonClass : ''}" ${currentPage === 1 ? 'aria-disabled="true"' : ''}>
      <i class="ri-arrow-left-line text-xl mr-2"></i> 上一页
    </a>
  `;

  const nextButton = utils.createHtml`
    <a href="${nextLink}" class="${buttonClass} ${!hasMore ? disabledButtonClass : ''}" ${!hasMore ? 'aria-disabled="true"' : ''}>
      下一页 <i class="ri-arrow-right-line text-xl ml-2"></i>
    </a>
  `;

  // 首页且是第一页时的特殊处理，显示“查看更多内容”
  if (isHomePage && currentPage === 1 && hasMore) {
    return utils.createHtml`
      <div class="pagination flex justify-center items-center mt-8">
        ${nextButton.replace('下一页', '').replace('ri-arrow-right-line', 'ri-arrow-down-line').replace('ml-2', 'mr-2').replace('Next', 'View More').replace(nextLink, '/page/2')}
        <span>查看更多内容</span>
      </div>
    `;
  }
  
  // 仅在需要显示导航时才渲染容器
  if (currentPage === 1 && !hasMore && !tag) { // 只有一页且没有标签的列表
    return '';
  }

  return utils.createHtml`
    <div class="pagination flex justify-between items-center mt-8">
      ${prevButton}
      <span class="text-sm text-gray-500 dark:text-gray-400">第 ${currentPage} 页</span>
      ${nextButton}
    </div>
  `;
}


// --- 基础HTML页面渲染 ---

// 辅助函数：渲染 `<head>` 部分的元数据和链接
function renderHeadContent(title, siteName) {
  // typeof window !== 'undefined' 用于在服务端渲染时安全访问 window 对象
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return utils.createHtml`
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
  `;
}

// 辅助函数：渲染 Tailwind CSS 配置
function renderTailwindConfigScript() {
  return utils.createHtml`
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
  `;
}

// 辅助函数：渲染自定义样式
function renderCustomStyles() {
  return utils.createHtml`
    <style>
      html::-webkit-scrollbar, 
      body::-webkit-scrollbar,
      pre::-webkit-scrollbar {
        width: 8px;
        height: 8px;
        background: rgba(255, 255, 255, 0);
        border-radius: 10px;
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
        transition: opacity 0.2s;
        background-color: #0c7cd51c;
        opacity: 0.5;
        will-change: opacity;
      }

      .article-content img.loaded, .mt-4 img.loaded {
        opacity: 1;
      }

      .article-content img:hover, .mt-4 img:hover {
        opacity: 0.9;
      }

      .image-placeholder {
        opacity: 1;
        transition: opacity 0.3s ease;
        will-change: opacity;
      }

      div.loaded .image-placeholder {
        opacity: 0;
      }
    </style>
  `;
}

// 辅助函数：渲染页面头部导航
function renderHeaderSection(siteName, navItemsHtml) {
  return utils.createHtml`
    <header class="flex items-center justify-between">
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
        <button id="theme-toggle" class="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-blue-500 hover:text-blue-700 focus:outline-none transition-colors shadow-sm" aria-label="切换主题">
          <i class="ri-sun-fill text-lg" id="theme-icon" aria-hidden="true"></i>
        </button>
      </div>
    </header>
  `;
}

// 辅助函数：渲染图片预览模态框
function renderImageModal() {
  return utils.createHtml`
    <div 
      id="imageModal" 
      class="image-modal fixed inset-0 w-full h-full bg-black/90 z-[100] justify-center items-center opacity-0 transition-opacity duration-300 ease-in-out will-change-opacity hidden"
      aria-modal="true" 
      aria-label="图片预览"
    >
      <div class="image-modal-content relative max-w-[90%] max-h-[90%] will-change-transform transform-gpu">
        <button 
          class="image-modal-close absolute -top-10 right-0 text-white text-2xl cursor-pointer bg-transparent border-none p-2 will-change-transform"
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
          <span>加载中...</span>
        </div>
        
        <figure class="w-full h-full flex items-center justify-center">
          <img 
            id="modalImage" 
            src="" 
            alt="预览图片" 
            loading="lazy" 
            class="max-w-full max-h-[90vh] max-w-[90vw] object-contain rounded opacity-0 transition-opacity duration-300 ease-in-out will-change-opacity"
          >
        </figure>
        
        <button 
          class="image-modal-prev absolute top-1/2 -translate-y-1/2 left-2.5 bg-black/50 text-white border-none text-2xl cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 will-change-transform,background-color hover:bg-black/70"
          aria-label="上一张"
        >
          <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
        </button>
        
        <button 
          class="image-modal-next absolute top-1/2 -translate-y-1/2 right-2.5 bg-black/50 text-white border-none text-2xl cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 will-change-transform,background-color hover:bg-black/70"
          aria-label="下一张"
        >
          <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `;
}


/**
 * 渲染完整的HTML页面。
 * @param {string} title - 页面标题。
 * @param {string|string[]} content - 页面主体内容（可以是单个HTML字符串或HTML字符串数组）。
 * @param {string} navLinks - 导航链接的原始字符串。
 * @param {string} siteName - 站点名称。
 * @param {number} [currentPage=1] - 当前页码。
 * @param {boolean} [hasMore=false] - 是否有更多内容。
 * @param {boolean} [isHomePage=false] - 是否是首页。
 * @param {string} [tag=''] - 当前标签（如果适用）。
 * @returns {Response} Hono HTML 响应。
 */
export function renderBaseHtml(title, content, navLinks, siteName, currentPage = 1, hasMore = false, isHomePage = false, tag = '') {
  const navItems = parseNavLinks(navLinks);
  const navItemsHtml = navItems.length > 0
    ? navItems.map(item => utils.createHtml`
        <li><a href="${item.url}" class="px-3 py-1.5 rounded-md transition-colors hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-sm font-medium text-blue-500 hover:text-blue-700">${item.text}</a></li>
      `).join('')
    : '';

  const articlesHtml = Array.isArray(content) ? content.join('') : content;

  return html`
    <!DOCTYPE html>
    <html lang="zh-CN" class="scroll-smooth">
      <head>
        ${renderHeadContent(title, siteName)}
        ${renderTailwindConfigScript()}
        ${renderCustomStyles()}
      </head>
      <body class="min-h-screen bg-custom-gradient dark:bg-custom-gradient-dark bg-fixed m-0 p-0 font-sans">
        <div class="container w-full max-w-2xl mx-auto px-4 py-12 sm:px-4 sm:py-12">
          <section class="bg-blue-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full">
            ${renderHeaderSection(siteName, navItemsHtml)}
            <main class="mt-8 relative">
              ${articlesHtml}
            </main>
            
            ${renderPagination({ currentPage, hasMore, isHomePage, tag })}
          </section>
        </div>

        <button 
          id="back-to-top" 
          class="back-to-top fixed bottom-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm cursor-pointer z-50 opacity-0 invisible transition-all duration-300 ease-in-out transform hover:bg-blue-700 hover:-translate-y-0.5"
          aria-label="返回顶部"
        >
          <i class="ri-skip-up-fill text-xl" aria-hidden="true"></i>
        </button>
        
        ${renderImageModal()}

        <script>
        ${clientScript}
        </script>
      </body>
    </html>
  `;
}

// 客户端脚本字符串 (保持原样，因为其内部逻辑已在之前优化)
const clientScript = `
  (function() {
    // Helper function for consistent DOM updates
    function safeDomUpdate(callback) {
      requestAnimationFrame(callback);
    }

    // --- 主题切换功能 ---
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

      // Initial theme setup
      const storedTheme = localStorage.theme;
      if (storedTheme && THEMES.includes(storedTheme)) {
        applyTheme(storedTheme);
      } else {
        // If no stored theme, default to system and apply dark class if system prefers dark
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          html.classList.add('dark');
        }
        updateThemeUI('system'); // Initialize UI for system theme
      }

      // Toggle mechanism
      themeToggle.addEventListener('click', () => {
        currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
        const newTheme = THEMES[currentThemeIndex];
        applyTheme(newTheme);
      });

      // Listen for system theme changes if 'system' theme is active
      const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemPreferenceChange = (event) => {
        // Only react if theme is currently 'system' (no localStorage.theme)
        if (!localStorage.theme) {
          safeDomUpdate(() => {
            html.classList.toggle('dark', event.matches);
          });
        }
      };
      mediaQueryList.addEventListener('change', handleSystemPreferenceChange);
    }

    // --- 返回顶部功能 ---
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
        rootMargin: '300px 0px 0px 0px' // Show button when 300px from top
      });

      observer.observe(pageTopSentinel);

      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // --- 图片预览功能 ---
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
      let isModalActive = false; // Prevent re-opening while already opening

      // Lazily load images that are off-screen
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

      // Handles loading image into the modal and showing/hiding loading state
      function loadImageIntoModal(imgElement) {
        loadingIndicator.style.display = 'flex';
        modalImg.classList.remove('loaded');

        modalImg.src = imgElement.currentSrc || imgElement.src;
        modalImg.alt = imgElement.alt || '预览图片';

        // Clear previous event listeners for this image to prevent multiple calls
        modalImg.onload = null;
        modalImg.onerror = null;

        const handleLoad = () => {
          modalImg.classList.add('loaded');
          loadingIndicator.style.display = 'none';
        };
        const handleError = () => {
          loadingIndicator.style.display = 'none';
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
          document.body.style.overflow = 'hidden'; // Prevent scrolling body
          updateNavigationButtons();
        });
      }

      function navigateImages(direction) { // direction: -1 for prev, 1 for next
        if (currentArticleImages.length <= 1) return;

        currentIndex = (currentIndex + direction + currentArticleImages.length) % currentArticleImages.length;
        const targetImg = currentArticleImages[currentIndex];

        if (targetImg) {
          loadImageIntoModal(targetImg);
        }
      }

      function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore body scrolling
        isModalActive = false;

        currentArticleImages = []; // Clear current images
        currentIndex = 0;
      }

      function getAllPreviewImages() {
        return Array.from(document.querySelectorAll('[data-preview="true"]'));
      }

      function getImagesInContext(triggerImg) {
        const article = triggerImg.closest('article');
        return article ? Array.from(article.querySelectorAll('[data-preview="true"]')) : getAllPreviewImages();
      }

      // Sets up initial lazy loading and 'loaded' class for images on the page
      function setupPageImages() {
        getAllPreviewImages().forEach(img => {
          // Prepare for lazy loading if src isn't a placeholder
          if (!img.dataset.src && img.src && !img.src.startsWith('data:image/svg+xml')) {
            img.setAttribute('data-src', img.src);
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
          }
          lazyLoadObserver.observe(img);

          // Add 'loaded' class for already loaded images or attach listeners
          if (!img.classList.contains('loaded')) {
            const handleLoad = () => {
              if (img.complete && img.naturalWidth > 0) {
                img.classList.add('loaded');
                if (img.parentNode) img.parentNode.classList.add('loaded'); // Add to parent if it's a container
              }
              img.removeEventListener('load', handleLoad); // Self-remove
              img.removeEventListener('error', handleError);
            };
            const handleError = () => {
              console.error('Image failed to load:', img.src);
              img.removeEventListener('load', handleLoad);
              img.removeEventListener('error', handleError);
            };

            if (img.complete) { // If image is already complete (e.g., cached)
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

      // Event listeners for modal navigation and closing
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

      // Delegated click handler for preview images
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

      // Observe DOM for new content (e.g., loaded via AJAX)
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
          setupPageImages(); // Re-initialize lazy loading and listeners for new images
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // Initial setup for existing images on page load
      setupPageImages();
    }

    // --- 初始化代码复制功能 ---
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

        // Ensure listeners are not added multiple times if init is called by observer
        if (button.dataset.hasCopyListener === 'true') return;
        button.dataset.hasCopyListener = 'true';

        button.addEventListener('click', () => {
          const originalCode = block.getAttribute('data-original-code');
          const codeText = originalCode ? decodeURIComponent(originalCode) : (block.querySelector('code')?.textContent || '');

          // Use modern Clipboard API first
          navigator.clipboard.writeText(codeText)
            .then(() => updateCopyButtonUI(button, true))
            .catch(() => {
              // Fallback for older browsers or denied permissions
              const textarea = document.createElement('textarea');
              textarea.value = codeText;
              Object.assign(textarea.style, {
                position: 'fixed', opacity: '0', top: '0', left: '0' // Make it invisible and off-screen
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

    // --- 增强的Markdown处理 (主要用于动态内容加载后的代码复制按钮初始化) ---
    function enhanceMarkdown() {
      // Observe DOM for new code blocks and re-initialize copy buttons
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
          initCodeCopyButtons(); // Re-run to find new buttons
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      initCodeCopyButtons(); // Initial run for existing code blocks
    }

    // --- 页面加载完成后初始化所有功能 ---
    document.addEventListener('DOMContentLoaded', () => {
      initThemeToggle();
      initImageViewer();
      enhanceMarkdown(); // Handles code copy buttons

      // initBackToTop can be delayed as it's not critical for initial display
      if ('requestIdleCallback' in window) {
        requestIdleCallback(initBackToTop);
      } else {
        setTimeout(initBackToTop, 200);
      }
    });
  })();
`;