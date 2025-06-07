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
        <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>
        <div class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
          <p class="text-red-600 dark:text-red-400 font-medium">加载失败</p>
        <p class="text-sm">${error.message}</p>
          <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
      </div>
      </article>
    `
  },
  
  // 404页面模板
  notFoundPage() {
    return utils.createHtml`
      <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
        <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">404</time>
        <div class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
          <p class="font-medium">未找到内容</p>
          <p>您访问的内容不存在或已被删除</p>
          <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
      </div>
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
        <div class="container">
          <div class="icon">📶</div>
          <h1>您当前处于离线状态</h1>
          <p>无法加载新内容。请检查您的网络连接并重试。</p>
          <a href="/" class="btn">刷新页面</a>
        </div>
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
          <div class="mt-4">
            <div class="w-full">
              <img 
                src="${resources[0].externalLink || ''}" 
                alt="${resources[0].filename || '图片'}"
                class="rounded-lg w-full hover:opacity-95 transition-opacity"
                loading="lazy"
                data-preview="true"
              />
            </div>
          </div>
        `;
      } else if (resources.length === 2) {
        // 两张图片 - 各50%宽度
        resourcesHtml = utils.createHtml`
          <div class="mt-4">
            <div class="flex flex-wrap gap-1">
              ${resources.map(resource => utils.createHtml`
                <div class="w-[calc(50%-2px)]">
                  <img 
                    src="${resource.externalLink || ''}" 
                    alt="${resource.filename || '图片'}"
                    class="rounded-lg w-full h-full object-cover hover:opacity-95 transition-opacity"
                    loading="lazy"
                    data-preview="true"
                  />
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        // 三张或更多图片 - 九宫格布局
        resourcesHtml = utils.createHtml`
          <div class="mt-4">
            <div class="grid grid-cols-3 gap-1">
              ${resources.map(resource => utils.createHtml`
                <div class="aspect-square">
                  <img 
                    src="${resource.externalLink || ''}" 
                    alt="${resource.filename || '图片'}"
                    class="rounded-lg w-full h-full object-cover hover:opacity-95 transition-opacity"
                    loading="lazy"
                    data-preview="true"
                  />
            </div>
          `).join('')}
        </div>
          </div>
        `;
      }
    }
    
    // 文章URL
    const articleUrl = isHomePage ? `/post/${memo.name}` : '#'
    
    // 使用时间轴样式渲染
    return utils.createHtml`
      <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
        <a href="${articleUrl}" class="block">
          <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">${formattedTime}</time>
        </a>
        <div class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
            ${parsedContent}
          ${resourcesHtml}
        </div>
      </article>
    `
  } catch (error) {
    console.error('渲染 memo 失败:', error)
    return utils.createHtml`
      <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
        <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>
        <div class="text-red-500 dark:text-red-400 leading-relaxed mt-1 md:text-base text-sm">
          <p>渲染失败: ${error.message}</p>
      </div>
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
      <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
          background-color: #f0f0f0;
        }
        
        .article-content img:hover, 
        .mt-4 img:hover {
          opacity: 0.9;
          }
        </style>
      </head>
    <body class="min-h-screen bg-custom-gradient dark:bg-custom-gradient-dark bg-fixed m-0 p-0 font-sans">
      <div class="container px-4 py-12 sm:px-4 sm:py-12 px-[10px] py-[20px]">
        <div class="bg-blue-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full sm:p-8 p-[15px]">
          <header class="flex items-center justify-between sm:flex-row flex-row">
            <div class="flex items-center">
              <a href="/" class="flex items-center">
                <h1 class="text-xl md:text-lg font-semibold font-poppins text-gray-800 dark:text-gray-100 mb-0 tracking-wide">${siteName}</h1>
              </a>
                </div>
            <div class="flex items-center space-x-4">
              <nav class="mr-1">
                <ul class="flex space-x-2">
                  ${navItemsHtml}
                </ul>
              </nav>
              <button id="theme-toggle" class="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-[#209cff] dark:text-[#68e0cf] hover:text-[#0c7cd5] dark:hover:text-[#8eeee0] focus:outline-none transition-colors shadow-sm">
                <i class="ri-sun-fill text-lg" id="theme-icon"></i>
                  </button>
            </div>
          </header>
          <main class="mt-8 relative">
            ${articlesHtml}
            </main>
          </div>
        </div>

      <div id="back-to-top" class="back-to-top">
        <i class="ri-skip-up-fill text-xl"></i>
      </div>
      
      <!-- 图片预览模态框 -->
      <div id="imageModal" class="image-modal">
        <div class="image-modal-content">
          <button class="image-modal-close">
            <i class="ri-close-line"></i>
          </button>
          <img id="modalImage" src="" alt="预览图片" loading="lazy">
          <button class="image-modal-prev">
            <i class="ri-arrow-left-s-line"></i>
          </button>
          <button class="image-modal-next">
            <i class="ri-arrow-right-s-line"></i>
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
              } else if (theme === 'dark') {
                themeIcon.className = 'ri-moon-fill text-lg';
              } else {
                themeIcon.className = 'ri-contrast-fill text-lg';
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
            
            // 监听滚动事件
            window.addEventListener('scroll', () => {
              if (window.scrollY > 300) {
                backToTop.classList.add('visible');
              } else {
                backToTop.classList.remove('visible');
              }
            });
              
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
            }
          }
        
          // 图片预览功能
          function initImageViewer() {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            const closeBtn = modal.querySelector('.image-modal-close');
            const prevBtn = modal.querySelector('.image-modal-prev');
            const nextBtn = modal.querySelector('.image-modal-next');
            
            let allImages = [];
            let currentIndex = 0;
            
            // 获取所有可点击图片
            function collectImages() {
              allImages = Array.from(document.querySelectorAll('.article-content img, .mt-4 img'));
              return allImages;
            }
            
            // 为所有图片添加点击事件
            function setupImageClickHandlers() {
              collectImages().forEach((img, index) => {
                img.style.cursor = 'pointer';
                img.addEventListener('click', () => {
                  showImage(img, index);
                });
              });
            }
            
            // 显示图片
            function showImage(img, index) {
              modalImg.src = img.src;
              modal.classList.add('active');
              currentIndex = index;
              document.body.style.overflow = 'hidden'; // 禁止背景滚动
              
              updateNavigationButtons();
            }
            
            // 更新导航按钮显示状态
            function updateNavigationButtons() {
              if (allImages.length <= 1) {
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
                return;
              }
              
              prevBtn.style.display = 'block';
              nextBtn.style.display = 'block';
            }
            
            // 显示上一张图片
            function showPreviousImage() {
              if (allImages.length <= 1) return;
              
              currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
              modalImg.src = allImages[currentIndex].src;
            }
            
            // 显示下一张图片
            function showNextImage() {
              if (allImages.length <= 1) return;
              
              currentIndex = (currentIndex + 1) % allImages.length;
              modalImg.src = allImages[currentIndex].src;
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
            setupImageClickHandlers();
            
            // 监听DOM变化，为新添加的图片绑定事件
            const observer = new MutationObserver(() => {
              setupImageClickHandlers();
            });
            
            observer.observe(document.body, { 
              childList: true, 
              subtree: true 
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