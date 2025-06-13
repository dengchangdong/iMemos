import { html } from 'hono/html'
import { CONFIG } from './config.js'
import { utils } from './utils.js'
import { simpleMarkdown } from './markdown.js'

// 优化HTML模板渲染 - 减少重复代码
export const htmlTemplates = {
  // 错误页面模板
  errorPage(error) {
    const header = utils.createHtml`
      <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>
    `;
    
    const content = utils.createHtml`
      <p class="text-red-600 dark:text-red-400 font-medium">加载失败</p>
      <p class="text-sm">${error.message}</p>
      <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
    `;
    
    return createArticleStructure(header, content);
  },
  
  // 404页面模板
  notFoundPage() {
    const header = utils.createHtml`
      <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">404</time>
    `;
    
    const content = utils.createHtml`
      <h2 class="font-medium">未找到内容</h2>
      <p>您访问的内容不存在或已被删除</p>
      <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
    `;
    
    return createArticleStructure(header, content);
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

// 创建文章结构 - 提取公共结构减少重复代码
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
          />
          <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 opacity-100 transition-opacity duration-300 image-placeholder">
            <i class="ri-image-line ${resources.length > 2 ? 'text-2xl' : 'text-3xl'}"></i>
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
    
    // 使用时间轴样式渲染
    return createArticleStructure(header, articleContent);
  } catch (error) {
    console.error('渲染 memo 失败:', error)
    return createArticleStructure(
      utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>`,
      utils.createHtml`<p class="text-red-500 dark:text-red-400">渲染失败: ${error.message}</p>`
    );
  }
}

// 渲染基础 HTML - 使用index.html作为模板
export function renderBaseHtml(title, content, navLinks, siteName, currentPage = 1, hasMore = false, isHomePage = false, tag = '') {
  const navItems = parseNavLinks(navLinks)
  const navItemsHtml = navItems.length > 0 
    ? navItems.map(item => utils.createHtml`
        <li><a href="${item.url}" class="px-3 py-1.5 rounded-md transition-colors hover:bg-blue-100/70 dark:hover:bg-blue-900/50 text-sm font-medium text-[#209cff] hover:text-[#0c7cd5]">${item.text}</a></li>
      `).join('')
    : '';

  let articlesHtml = Array.isArray(content) ? content.join('') : content;

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
      </head>
      <body class="min-h-screen bg-custom-gradient dark:bg-custom-gradient-dark bg-fixed m-0 p-0 font-sans">
        <div class="container w-full mx-auto max-w-[640px] px-4 py-12 sm:px-4 sm:py-12 px-[10px] py-[20px]">
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
                <button id="theme-toggle" class="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 text-[#209cff] hover:text-[#0c7cd5] focus:outline-none transition-colors shadow-sm" aria-label="切换主题">
                  <i class="ri-sun-fill text-lg" id="theme-icon" aria-hidden="true"></i>
                </button>
              </div>
            </header>
            <main class="mt-8 relative">
              ${articlesHtml}
            </main>
            
            <!-- 分页导航 -->
            ${isHomePage ? 
              (currentPage === 1 ?
                utils.createHtml`
                <div class="pagination flex justify-center items-center mt-8 pt-4">
                  <a href="/page/2" class="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-blue-500 text-white no-underline border-none cursor-pointer hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow">
                    <i class="ri-arrow-down-line text-xl mr-2"></i> 查看更多内容
                  </a>
                </div>
                ` : 
                utils.createHtml`
              <div class="pagination flex justify-between items-center mt-8 pt-4">
                <a href="${currentPage > 2 ? `/page/${currentPage - 1}` : '/'}" class="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-blue-500 text-white no-underline border-none cursor-pointer hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow">
                  <i class="ri-arrow-left-line text-xl mr-2"></i> 上一页
                </a>
                <span class="text-sm text-gray-500 dark:text-gray-400">第 ${currentPage} 页</span>
                <a href="/page/${currentPage + 1}" class="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-blue-500 text-white no-underline border-none cursor-pointer hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow ${hasMore ? '' : 'invisible'}">
                  下一页 <i class="ri-arrow-right-line text-xl ml-2"></i>
                </a>
              </div>
                `
              ) : 
              (tag ?
                utils.createHtml`
                <div class="pagination flex justify-between items-center mt-8 pt-4">
                  <a href="${currentPage > 2 ? `/page/${currentPage - 1}` : '/'}" class="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-blue-500 text-white no-underline border-none cursor-pointer hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow">
                    <i class="ri-arrow-left-line text-xl mr-2"></i> 上一页
                  </a>
                  <span class="text-sm text-gray-500 dark:text-gray-400">第 ${currentPage} 页</span>
                  <a href="/page/${currentPage + 1}" class="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-blue-500 text-white no-underline border-none cursor-pointer hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow ${hasMore ? '' : 'invisible'}">
                    下一页 <i class="ri-arrow-right-line text-xl ml-2"></i>
                  </a>
                </div>
                ` : '')
            }
          </section>
        </div>

        <button 
          id="back-to-top" 
          class="fixed bottom-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm cursor-pointer z-50 opacity-0 invisible transition-all duration-300 ease-in-out transform hover:bg-blue-700 hover:-translate-y-0.5 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-700"
          aria-label="返回顶部"
        >
          <i class="ri-skip-up-fill text-xl" aria-hidden="true"></i>
        </button>
        
        <!-- 图片预览模态框 -->
        <div 
          id="imageModal" 
          class="fixed inset-0 w-full h-full bg-black/90 z-[100] justify-center items-center opacity-0 transition-opacity duration-300 ease-in-out will-change-opacity hidden"
          aria-modal="true" 
          aria-label="图片预览"
        >
          <div class="relative max-w-[90%] max-h-[90%] will-change-transform transform-gpu">
            <button 
              class="absolute -top-10 right-0 text-white text-2xl cursor-pointer bg-transparent border-none p-2 will-change-transform"
              aria-label="关闭预览"
            >
              <i class="ri-close-line" aria-hidden="true"></i>
            </button>
            
            <div 
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-base flex flex-col items-center gap-2.5"
              role="status" 
              aria-live="polite"
            >
              <div class="w-10 h-10 border-[3px] border-white/30 rounded-full border-t-white animate-spin will-change-transform"></div>
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
              class="absolute top-1/2 -translate-y-1/2 left-2.5 bg-black/50 text-white border-none text-2xl cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 will-change-transform,background-color hover:bg-black/70"
              aria-label="上一张"
            >
              <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
            </button>
            
            <button 
              class="absolute top-1/2 -translate-y-1/2 right-2.5 bg-black/50 text-white border-none text-2xl cursor-pointer w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 will-change-transform,background-color hover:bg-black/70"
              aria-label="下一张"
            >
              <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <script>
        (function() {
          // 性能优化：使用变量缓存DOM元素和计算结果
          const themeToggle = document.getElementById('theme-toggle');
          const themeIcon = document.getElementById('theme-icon');
          const html = document.documentElement;
          const modal = document.getElementById('imageModal');
          const modalImg = document.getElementById('modalImage');
          const backToTop = document.getElementById('back-to-top');
          
          // 主题切换功能
          function initThemeToggle() {
            const themes = ['system', 'light', 'dark'];
            let currentTheme = localStorage.theme === 'dark' ? 2 : localStorage.theme === 'light' ? 1 : 0;
            
            function updateIcon(theme) {
              themeIcon.className = `ri-${theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'contrast'}-fill text-lg`;
              themeToggle.setAttribute('aria-label', `切换到${theme === 'light' ? '深色' : theme === 'dark' ? '浅色' : '系统'}模式`);
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
                  html.classList.toggle('dark', prefersDark);
                }
                updateIcon(theme);
              });
            }
            
            // 初始化主题
            applyTheme(themes[currentTheme]);
            
            // 主题切换
            themeToggle.addEventListener('click', () => {
              currentTheme = (currentTheme + 1) % 3;
              applyTheme(themes[currentTheme]);
            });
            
            // 系统主题变化监听
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
              if (!localStorage.theme) {
                requestAnimationFrame(() => {
                  html.classList.toggle('dark', e.matches);
                });
              }
            });
          }
          
          // 返回顶部功能
          function initBackToTop() {
            const observer = new IntersectionObserver((entries) => {
              requestAnimationFrame(() => {
                backToTop.classList.toggle('visible', !entries[0].isIntersecting);
              });
            }, { threshold: 0, rootMargin: '300px 0px 0px 0px' });
            
            const pageTop = document.createElement('div');
            Object.assign(pageTop.style, {
              position: 'absolute',
              top: '0',
              left: '0',
              width: '1px',
              height: '1px',
              pointerEvents: 'none'
            });
            document.body.appendChild(pageTop);
            observer.observe(pageTop);
            
            backToTop.addEventListener('click', () => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            });
          }
          
          // 图片预览功能
          function initImageViewer() {
            const closeBtn = modal.querySelector('.image-modal-close');
            const prevBtn = modal.querySelector('.image-modal-prev');
            const nextBtn = modal.querySelector('.image-modal-next');
            const loadingIndicator = modal.querySelector('.image-loading');
            
            let allImages = [];
            let currentArticleImages = [];
            let currentIndex = 0;
            let isModalActive = false;
            
            // 懒加载图片
            const lazyLoadObserver = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  const img = entry.target;
                  const dataSrc = img.getAttribute('data-src');
                  if (dataSrc) {
                    img.src = dataSrc;
                    img.removeAttribute('data-src');
                    lazyLoadObserver.unobserve(img);
                  }
                }
              });
            }, { rootMargin: '200px' });
            
            function collectImages() {
              return Array.from(document.querySelectorAll('[data-preview="true"]'));
            }
            
            function getImagesInCurrentArticle(img) {
              const article = img.closest('article');
              return article ? Array.from(article.querySelectorAll('[data-preview="true"]')) : collectImages();
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
                  modalImg.onload = () => {
                    modalImg.classList.add('loaded');
                    loadingIndicator.style.display = 'none';
                  };
                  modalImg.onerror = () => {
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
                        img.parentNode?.classList.add('loaded');
                      }
                    };
                    
                    img._errorHandler = () => {
                      console.error('Image failed to load:', img.src);
                    };
                    
                    if (img.complete) {
                      img.naturalWidth > 0 ? img._markAsLoadedHandler() : img._errorHandler();
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
                modalImg.onload = () => {
                  modalImg.classList.add('loaded');
                  loadingIndicator.style.display = 'none';
                };
                modalImg.onerror = () => {
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
                modalImg.onload = () => {
                  modalImg.classList.add('loaded');
                  loadingIndicator.style.display = 'none';
                };
                modalImg.onerror = () => {
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
            
            const observer = new MutationObserver((mutations) => {
              const hasNewImages = mutations.some(mutation => 
                mutation.type === 'childList' && 
                Array.from(mutation.addedNodes).some(node => 
                  node.nodeType === Node.ELEMENT_NODE && 
                  (node.querySelector('[data-preview="true"]') || node.matches('[data-preview="true"]'))
                )
              );
              
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
          
          // 代码复制功能
          function initCodeCopyButtons() {
            document.querySelectorAll('pre').forEach(block => {
              if (block.previousElementSibling?.classList.contains('code-header')) return;
              
              const code = block.querySelector('code');
              const language = code?.className?.replace('language-', '') || 
                             block.getAttribute('data-language') || 
                             'plaintext';
              
              const header = document.createElement('div');
              header.className = 'flex justify-between items-center bg-gray-100 dark:bg-gray-800 rounded-t-lg px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700';
              
              const langLabel = document.createElement('span');
              langLabel.className = 'font-mono font-medium';
              langLabel.textContent = language;
              header.appendChild(langLabel);
              
              const button = document.createElement('button');
              button.className = 'p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors';
              button.innerHTML = '<i class="ri-file-copy-line"></i>';
              button.setAttribute('aria-label', '复制代码');
              button.setAttribute('type', 'button');
              header.appendChild(button);
              
              block.parentNode.insertBefore(header, block);
              
              button.addEventListener('click', async () => {
                const codeText = code?.textContent || block.textContent;
                
                try {
                  await navigator.clipboard.writeText(codeText);
                  button.innerHTML = '<i class="ri-check-line"></i>';
                  button.classList.add('bg-green-500', 'text-white');
                  
                  setTimeout(() => {
                    button.innerHTML = '<i class="ri-file-copy-line"></i>';
                    button.classList.remove('bg-green-500', 'text-white');
                  }, 2000);
                } catch (err) {
                  const textarea = document.createElement('textarea');
                  textarea.value = codeText;
                  textarea.style.position = 'fixed';
                  textarea.style.opacity = '0';
                  document.body.appendChild(textarea);
                  textarea.select();
                  
                  try {
                    document.execCommand('copy');
                    button.innerHTML = '<i class="ri-check-line"></i>';
                    button.classList.add('bg-green-500', 'text-white');
                  } catch (e) {
                    button.innerHTML = '<i class="ri-error-warning-line"></i>';
                    console.error('复制失败:', e);
                  }
                  
                  document.body.removeChild(textarea);
                  
                  setTimeout(() => {
                    button.innerHTML = '<i class="ri-file-copy-line"></i>';
                    button.classList.remove('bg-green-500', 'text-white');
                  }, 2000);
                }
              });
            });
          }
          
          // 增强的Markdown处理
          function enhanceMarkdown() {
            const observer = new MutationObserver((mutations) => {
              const hasNewCodeBlocks = mutations.some(mutation => 
                mutation.type === 'childList' && 
                Array.from(mutation.addedNodes).some(node => 
                  node.nodeType === Node.ELEMENT_NODE && 
                  (node.querySelector('pre') || node.matches('pre'))
                )
              );
              
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
        </script>
      </body>
    </html>
  `;
} 
