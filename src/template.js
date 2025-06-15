import { html } from 'hono/html'
import { CONFIG } from './config.js'
import { utils } from './utils.js'
import { simpleMarkdown } from './markdown.js'

// 优化HTML模板渲染 - 减少重复代码
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
  
  // 404页面模板
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

// 创建资源HTML
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
function renderPagination({ currentPage, hasMore, isHomePage, tag = '' }) {
  if (!isHomePage && !tag) {
    return '';
  }

  const buttonClass = "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-blue-500 text-white no-underline border-none cursor-pointer hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow";

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
      <span class="text-sm text-gray-500 dark:text-gray-400">第 ${currentPage} 页</span>
      <a href="${nextPageLink}" class="${buttonClass} ${hasMore ? '' : 'invisible'}">
        下一页 <i class="ri-arrow-right-line text-xl ml-2"></i>
      </a>
    </div>
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
        <meta property="og:url" content="${typeof window !== 'undefined' ? window.location.href : ''}">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${siteName} - 博客">
        <meta property="og:image" content="${typeof window !== 'undefined' ? window.location.origin : ''}/og-image.jpg">
        
        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="${typeof window !== 'undefined' ? window.location.href : ''}">
        <meta property="twitter:title" content="${title}">
        <meta property="twitter:description" content="${siteName} - 博客">
        <meta property="twitter:image" content="${typeof window !== 'undefined' ? window.location.origin : ''}/og-image.jpg">
        
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

          article::before {
            content: '';
            width: 17px;
            height: 17px;
            background-color: white;
            border: 1px solid #4e5ed3;
            border-radius: 50%;
            position: absolute;
            left: -10px;
            top: 0;
            box-shadow: 3px 3px 0px #bab5f8;
            will-change: transform;
          }
          .dark article::before {
            background-color: #1f2937;
            border-color: #818cf8;
            box-shadow: 3px 3px 0px #6366f1;
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
          .copy-btn.copied {
            background-color: #10b981;
            color: white;
          }
          .dark .copy-btn.copied {
            background-color: #059669;
          }
        </style>
      </head>
      <body class="min-h-screen bg-custom-gradient dark:bg-custom-gradient-dark bg-fixed m-0 p-0 font-sans">
        <div class="container w-full max-w-2xl mx-auto px-4 py-12 sm:px-4 sm:py-12">
          <section class="bg-blue-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full">
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
            <main class="mt-8 relative">
              ${articlesHtml}
            </main>
            
            <!-- 分页导航 -->
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
        
        <!-- 图片预览模态框 -->
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

        <script>
        ${clientScript}
        </script>
      </body>
    </html>
  `;
}

const clientScript = `
  (function() {
    // 主题切换功能
    function initThemeToggle() {
      const themeToggle = document.getElementById('theme-toggle');
      const themeIcon = document.getElementById('theme-icon');
      const html = document.documentElement;
      
      const themes = ['system', 'light', 'dark'];
      let currentTheme = 0;
      
      function updateIcon(theme) {
        themeIcon.className = theme === 'light' 
          ? 'ri-sun-fill text-lg' 
          : theme === 'dark' 
            ? 'ri-moon-fill text-lg' 
            : 'ri-contrast-fill text-lg';
        
        themeToggle.setAttribute('aria-label', 
          theme === 'light' 
            ? '切换到深色模式' 
            : theme === 'dark' 
              ? '切换到浅色模式' 
              : '切换到系统模式'
        );
      }
      
      function applyTheme(theme) {
        requestAnimationFrame(() => {
          if (theme === 'light') {
            html.classList.remove('dark');
            localStorage.theme = 'light';
          } else if (theme === 'dark') {
            html.classList.add('dark');
            localStorage.theme = 'dark';
          } else {
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
      
      const storedTheme = localStorage.theme;
      if (storedTheme === 'dark') {
        html.classList.add('dark');
        currentTheme = 2;
        updateIcon('dark');
      } else if (storedTheme === 'light') {
        html.classList.remove('dark');
        currentTheme = 1;
        updateIcon('light');
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          html.classList.add('dark');
        }
        updateIcon('system');
      }
      
      themeToggle.addEventListener('click', () => {
        currentTheme = (currentTheme + 1) % 3;
        const newTheme = themes[currentTheme];
        applyTheme(newTheme);
      });

      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handleThemeChange = (e) => {
        if (!localStorage.theme) {
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

    // 返回顶部功能
    function initBackToTop() {
      const backToTop = document.getElementById('back-to-top');
      
      const observer = new IntersectionObserver((entries) => {
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
        rootMargin: '300px 0px 0px 0px'
      });
      
      const pageTop = document.createElement('div');
      pageTop.style.position = 'absolute';
      pageTop.style.top = '0';
      pageTop.style.left = '0';
      pageTop.style.width = '1px';
      pageTop.style.height = '1px';
      pageTop.style.pointerEvents = 'none';
      document.body.appendChild(pageTop);
      observer.observe(pageTop);
        
      backToTop.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
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
      }, {
        rootMargin: '200px'
      });
      
      function collectImages() {
        allImages = Array.from(document.querySelectorAll('[data-preview="true"]'));
        return allImages;
      }
      
      function getImagesInCurrentArticle(img) {
        const article = img.closest('article');
        if (!article) return collectImages();
        return Array.from(article.querySelectorAll('[data-preview="true"]'));
      }
      
      function showImage(img, index) {
        if (isModalActive) return;
        
        isModalActive = true;
        currentIndex = index;
        
        requestAnimationFrame(() => {
          loadingIndicator.style.display = 'flex';
          modalImg.classList.remove('loaded');
          
          const imgSrc = img.currentSrc || img.src;
          
          if (modalImg.src !== imgSrc) {
            modalImg.src = imgSrc;
          }
          
          modalImg.alt = img.alt || '预览图片';
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
          
          if (modalImg.complete && modalImg.naturalWidth > 0) {
            modalImg.classList.add('loaded');
            loadingIndicator.style.display = 'none';
          } else {
            modalImg.onload = function() {
              modalImg.classList.add('loaded');
              loadingIndicator.style.display = 'none';
            };
            
            modalImg.onerror = function() {
              loadingIndicator.style.display = 'none';
            };
          }
          
          updateNavigationButtons();
        });
      }
      
      function setupImageLoadHandlers() {
        const images = collectImages();
        
        requestAnimationFrame(() => {
          images.forEach((img) => {
            if (!img.dataset.src && !img.classList.contains('lazy-loaded')) {
              const originalSrc = img.src;
              if (originalSrc && !img.complete) {
                img.setAttribute('data-src', originalSrc);
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
                lazyLoadObserver.observe(img);
              }
            }
            
            if (!img.classList.contains('loaded')) {
              img.removeEventListener('load', img._markAsLoadedHandler);
              img.removeEventListener('error', img._errorHandler);
              
              img._markAsLoadedHandler = () => {
                if (img.complete && img.naturalWidth > 0) {
                  img.classList.add('loaded');
                  if (img.parentNode) {
                    img.parentNode.classList.add('loaded');
                  }
                }
              };
              
              img._errorHandler = () => {
                console.error('Image failed to load:', img.src);
              };

              if (img.complete) {
                if (img.naturalWidth > 0) {
                  img._markAsLoadedHandler();
                } else {
                  img._errorHandler();
                }
              } else {
                img.addEventListener('load', img._markAsLoadedHandler);
                img.addEventListener('error', img._errorHandler);
              }
            }
          });
        });
      }
      
      function showPreviousImage() {
        if (currentArticleImages.length <= 1) return;
        
        currentIndex = (currentIndex - 1 + currentArticleImages.length) % currentArticleImages.length;
        const prevImg = currentArticleImages[currentIndex];
        
        if (!prevImg) return;
        
        loadingIndicator.style.display = 'flex';
        modalImg.classList.remove('loaded');
        
        const imgSrc = prevImg.currentSrc || prevImg.src;
        
        if (modalImg.src !== imgSrc) {
          modalImg.src = imgSrc;
        }
        
        modalImg.alt = prevImg.alt || '预览图片';
        
        if (modalImg.complete && modalImg.naturalWidth > 0) {
          modalImg.classList.add('loaded');
          loadingIndicator.style.display = 'none';
        } else {
          modalImg.onload = function() {
            modalImg.classList.add('loaded');
            loadingIndicator.style.display = 'none';
          };
          modalImg.onerror = function() {
            loadingIndicator.style.display = 'none';
          };
        }
      }
      
      function showNextImage() {
        if (currentArticleImages.length <= 1) return;
        
        currentIndex = (currentIndex + 1) % currentArticleImages.length;
        const nextImg = currentArticleImages[currentIndex];
        
        if (!nextImg) return;
        
        loadingIndicator.style.display = 'flex';
        modalImg.classList.remove('loaded');
        
        const imgSrc = nextImg.currentSrc || nextImg.src;
        
        if (modalImg.src !== imgSrc) {
          modalImg.src = imgSrc;
        }
        
        modalImg.alt = nextImg.alt || '预览图片';
        
        if (modalImg.complete && modalImg.naturalWidth > 0) {
          modalImg.classList.add('loaded');
          loadingIndicator.style.display = 'none';
        } else {
          modalImg.onload = function() {
            modalImg.classList.add('loaded');
            loadingIndicator.style.display = 'none';
          };
          modalImg.onerror = function() {
            loadingIndicator.style.display = 'none';
          };
        }
      }
      
      function updateNavigationButtons() {
        const hasMultipleImages = currentArticleImages.length > 1;
        
        requestAnimationFrame(() => {
          prevBtn.style.display = hasMultipleImages ? 'flex' : 'none';
          nextBtn.style.display = hasMultipleImages ? 'flex' : 'none';
        });
      }
      
      function setupImageClickHandlers() {
        document.addEventListener('click', (e) => {
          const img = e.target.closest('[data-preview="true"]');
          const container = e.target.closest('.image-container');
          
          if (img) {
            e.preventDefault();
            currentArticleImages = getImagesInCurrentArticle(img);
            const index = currentArticleImages.indexOf(img);
            if (index !== -1) {
              showImage(img, index);
            }
          } else if (container) {
            e.preventDefault();
            const containerImg = container.querySelector('[data-preview="true"]');
            if (containerImg) {
              currentArticleImages = getImagesInCurrentArticle(containerImg);
              const imgIndex = currentArticleImages.indexOf(containerImg);
              if (imgIndex !== -1) {
                showImage(containerImg, imgIndex);
              }
            }
          }
        }, { passive: false });
      }
      
      function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        isModalActive = false;
        
        currentArticleImages = [];
        currentIndex = 0;
      }
      
      closeBtn.addEventListener('click', closeModal);
      prevBtn.addEventListener('click', showPreviousImage);
      nextBtn.addEventListener('click', showNextImage);
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
      
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
      
      setupImageLoadHandlers();
      
      const observer = new MutationObserver((mutations) => {
        let hasNewImages = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
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
        
        if (hasNewImages) {
          allImages = [];
          setupImageLoadHandlers();
        }
      });
      
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: false,
        characterData: false
      });
      
      setupImageLoadHandlers();
      setupImageClickHandlers();
    }

    // 初始化代码复制功能
    function initCodeCopyButtons() {
      document.querySelectorAll('.code-block').forEach(block => {
        const button = block.querySelector('.copy-btn');
        if (!button) return;
        
        button.addEventListener('click', () => {
          // 获取原始代码
          const originalCode = block.getAttribute('data-original-code');
          const codeText = originalCode ? 
            decodeURIComponent(originalCode) : 
            block.querySelector('code')?.textContent || '';
          
          navigator.clipboard.writeText(codeText).then(() => {
            button.innerHTML = '<i class="ri-check-line"></i>';
            button.classList.add('copied');
            
            setTimeout(() => {
              button.innerHTML = '<i class="ri-file-copy-line"></i>';
              button.classList.remove('copied');
            }, 2000);
          }).catch(err => {
            const textarea = document.createElement('textarea');
            textarea.value = codeText;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
              document.execCommand('copy');
              button.innerHTML = '<i class="ri-check-line"></i>';
              button.classList.add('copied');
            } catch (e) {
              button.innerHTML = '<i class="ri-error-warning-line"></i>';
              console.error('复制失败:', e);
            }
            
            document.body.removeChild(textarea);
            
            setTimeout(() => {
              button.innerHTML = '<i class="ri-file-copy-line"></i>';
              button.classList.remove('copied');
            }, 2000);
          });
        });
      });
    }
    
    // 增强的Markdown处理
    function enhanceMarkdown() {
      const observer = new MutationObserver((mutations) => {
        let hasNewCodeBlocks = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.querySelector('pre') || node.matches('pre')) {
                  hasNewCodeBlocks = true;
                  break;
                }
              }
            }
            
            if (hasNewCodeBlocks) break;
          }
        }
        
        if (hasNewCodeBlocks) {
          initCodeCopyButtons();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
      });
      
      initCodeCopyButtons();
    }

    // 页面加载完成后初始化所有功能
    document.addEventListener('DOMContentLoaded', () => {
      initThemeToggle();
      initImageViewer();
      enhanceMarkdown();
      
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => initBackToTop());
      } else {
        setTimeout(() => initBackToTop(), 200);
      }
    });
  })();
`;