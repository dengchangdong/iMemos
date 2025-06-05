import { html } from 'hono/html'
import CONFIG from './config.js';
import { utils } from './utils.js';
import { simpleMarkdown } from './markdown.js';

// 解析导航链接
export function parseNavLinks(linksStr) {
  return linksStr.split(',').map(link => {
    const [name, url] = link.split(':')
    return { name, url }
  })
}

// 渲染页头
export function renderHeader(siteName, navLinks) {
  return `
    <header class="">
      <div class="container mx-auto px-4 py-4 max-w-3xl">
        <div class="flex flex-row justify-between items-center">
          <h1 class="text-2xl font-bold">
            <a href="/" class="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
              ${siteName}
            </a>
          </h1>
          <nav>
            <ul class="flex space-x-6">
              ${parseNavLinks(navLinks).map(link => `
                <li>
                  <a href="${link.url}" class="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
                    ${link.name}
                  </a>
                </li>
              `).join('')}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  `
}

// 渲染页脚
export function renderFooter(footerText) {
  return `
    <footer class="">
      <div class="container mx-auto px-4 py-6 max-w-3xl">
        <div class="text-center text-zinc-600 dark:text-zinc-400">
          ${footerText}
        </div>
      </div>
    </footer>
  `
}

// 渲染图片预览模态框
export function renderImageModal() {
  return `
    <div id="imageModal" class="image-modal">
      <img id="modalImage" src="" alt="预览图片">
    </div>
  `
}

// 渲染公共样式
export function renderStyles() {
  return `
    <style>
      .image-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 1000;
        cursor: zoom-out;
      }
      .image-modal img {
        max-width: 90%;
        max-height: 90vh;
        margin: auto;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        object-fit: contain;
      }
    </style>
  `
}

// 渲染公共脚本
export function renderScripts() {
  return `
    <script>
      // 检测系统主题
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      }

      // 监听系统主题变化
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      })

      // 图片预览功能
      const imageModal = document.getElementById('imageModal')
      const modalImage = document.getElementById('modalImage')

      function showImageModal(src) {
        modalImage.src = src
        imageModal.style.display = 'block'
        document.body.style.overflow = 'hidden'
      }

      function hideImageModal() {
        imageModal.style.display = 'none'
        document.body.style.overflow = ''
      }

      imageModal.addEventListener('click', hideImageModal)
    </script>
  `
}

// 渲染离线页面
export function renderOfflinePage(siteName, transparentPixel) {
  return `
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
        .hidden {
          display: none;
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
        ${transparentPixel ? `<img src="data:image/png;base64,${transparentPixel}" alt="" class="hidden" id="offline-image">` : ''}
      </div>
      <script>
        // 离线图片占位符预加载
        if (window.navigator.serviceWorker) {
          const offlineImg = document.getElementById('offline-image');
          if (offlineImg) {
            // 将图片数据注册到缓存中，以便在离线时使用
            const imgData = offlineImg.src;
            if (imgData) {
              // 创建一个内存中的缓存，用于存储离线图片
              const cacheOfflineImg = async () => {
                try {
                  const cache = await caches.open('offline-images');
                  const response = new Response(
                    Uint8Array.from(atob(imgData.split(',')[1]), c => c.charCodeAt(0)).buffer,
                    { headers: { 'Content-Type': 'image/png' } }
                  );
                  await cache.put('/offline-image.png', response);
                  console.log('离线图片已缓存');
                } catch (e) {
                  console.error('缓存离线图片失败:', e);
                }
              };
              
              // 当页面加载完成后执行缓存
              window.addEventListener('load', cacheOfflineImg);
            }
          }
        }
      </script>
    </body>
    </html>
  `;
}

// 优化HTML模板渲染 - 减少重复代码
export const htmlTemplates = {
  // 错误页面模板
  errorPage(error) {
    return utils.createHtml`
      <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">加载失败</h2>
        <p class="text-sm">${error.message}</p>
        <a href="/" class="inline-flex items-center mt-4 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
          <i class="ti ti-arrow-left mr-1"></i>
          返回首页
        </a>
      </div>
    `;
  },
  
  // 404页面模板
  notFoundPage() {
    return utils.createHtml`
      <div class="text-center py-12">
        <i class="ti ti-alert-circle text-5xl text-gray-400 mb-4"></i>
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">未找到内容</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">您访问的内容不存在或已被删除</p>
        <a href="/" class="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          <i class="ti ti-arrow-left mr-1"></i>
          返回首页
        </a>
      </div>
    `;
  }
};

// 渲染单个 memo
export function renderMemo(memo, isHomePage = false) {
  try {
    const timestamp = memo.createTime 
      ? new Date(memo.createTime).getTime()
      : memo.createdTs * 1000;
    const date = utils.formatTime(timestamp);
    
    // 使用简易Markdown渲染内容
    const content = memo.content || '';
    // 使用从markdown.js导入的simpleMarkdown
    const parsedContent = simpleMarkdown(content);
    
    // 资源处理 - 图片预览优化
    const resources = memo.resources || memo.resourceList || [];
    let resourcesHtml = '';
    
    if (resources.length > 0) {
      // 优化布局类选择逻辑
      const gridCols = resources.length === 1 ? 'grid-cols-1' : 
                      resources.length === 2 ? 'grid-cols-2' : 
                      'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      
      // 使用模板字符串生成HTML
      resourcesHtml = utils.createHtml`
        <div class="grid ${gridCols} gap-4 mt-6">
          ${resources.map(resource => utils.createHtml`
            <div class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer" onclick="showImage(this.querySelector('img'))">
              <img 
                src="${resource.externalLink || ''}" 
                alt="${resource.filename || '图片'}"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
                loading="lazy"
                data-preview="true"
              />
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 rounded-lg"></div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // 根据页面类型生成时间HTML
    const timeHtml = isHomePage 
      ? utils.createHtml`<time class="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
           <a href="/post/${memo.name}" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
             ${date}
           </a>
         </time>`
      : utils.createHtml`<time class="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">${date}</time>`;
    
    // 组合最终HTML
    return utils.createHtml`
      <article class="${CONFIG.CSS.CARD}">
        <div class="p-6 sm:p-8">
          ${timeHtml}
          <div class="mt-4 ${CONFIG.CSS.PROSE}">
            ${parsedContent}
          </div>
          ${resourcesHtml}
        </div>
      </article>
    `;
  } catch (error) {
    console.error('渲染 memo 失败:', error);
    return utils.createHtml`
      <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        <p class="font-medium">渲染失败</p>
        <p class="text-sm mt-1">${error.message}</p>
      </div>
    `;
  }
}

// 渲染基础 HTML - 优化CSS加载和脚本处理
export function renderBaseHtml(title, content, footerText, navLinks, siteName) {
  // 解析导航链接
  let navItems = [];
  try {
    if (navLinks) {
      // 将单引号替换为双引号，以符合 JSON 格式
      const jsonStr = navLinks.replace(/'/g, '"');
      const linksObj = JSON.parse(jsonStr);
      navItems = Object.entries(linksObj).map(([text, url]) => ({ text, url }));
    }
  } catch (error) {
    console.error('解析导航链接失败:', error);
  }

  // 导航链接HTML
  const navHtml = navItems.length > 0 
    ? utils.createHtml`
      <nav class="flex items-center space-x-6">
        ${navItems.map(item => utils.createHtml`
          <a href="${item.url}" class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            ${item.text}
          </a>
        `).join('')}
      </nav>
    ` : '';

  return utils.createHtml`
    <!DOCTYPE html>
    <html lang="zh-CN" class="scroll-smooth">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Inter var', 'system-ui', 'sans-serif'],
                  serif: ['Noto Serif SC', 'serif'],
                },
                typography: {
                  DEFAULT: {
                    css: {
                      maxWidth: 'none',
                      color: 'inherit',
                      a: {
                        color: 'inherit',
                        textDecoration: 'none',
                        fontWeight: '500',
                      },
                      strong: {
                        color: 'inherit',
                      },
                      code: {
                        color: 'inherit',
                      },
                      h1: {
                        color: 'inherit',
                      },
                      h2: {
                        color: 'inherit',
                      },
                      h3: {
                        color: 'inherit',
                      },
                      h4: {
                        color: 'inherit',
                      },
                    },
                  },
                },
              },
            },
          }
        </script>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">
        <style>
          .prose {
            max-width: 65ch;
            color: #374151;
          }

          .prose p {
            margin-top: 1.25em;
            margin-bottom: 1.25em;
          }

          .dark .prose {
            color: #E5E7EB;
          }

          /* 抖音视频容器样式 */
          .douyin-container {
            display: flex;
            justify-content: center;
            align-items: center;
            max-width: 100%;
            margin: 1rem auto;
          }
          
          .douyin-container iframe {
            max-width: 100%;
            border-radius: 8px;
          }

          .image-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 50;
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
            margin: auto;
            position: relative;
          }

          .image-modal-content img {
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
          }

          .image-modal-close {
            position: absolute;
            top: -40px;
            right: 0;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            padding: 0.5rem;
          }

          .image-modal-prev,
          .image-modal-next {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            color: white;
            font-size: 2rem;
            cursor: pointer;
            padding: 1rem;
            user-select: none;
          }

          .image-modal-prev {
            left: 0;
          }

          .image-modal-next {
            right: 0;
          }
        </style>
      </head>
      <body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <header class="">
          <div class="container mx-auto px-4 py-6 max-w-3xl">
            <div class="flex flex-row justify-between items-center">
              <h1 class="text-2xl font-bold">
                <a href="/" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  ${siteName || 'Memos'}
                </a>
              </h1>
              <div class="flex items-center space-x-4">
                ${navHtml}
                <div class="relative group">
                  <button id="theme-toggle" class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <i id="theme-toggle-dark-icon" class="ti ti-moon hidden"></i>
                    <i id="theme-toggle-light-icon" class="ti ti-sun hidden"></i>
                    <i id="theme-toggle-system-icon" class="ti ti-device-desktop hidden"></i>
                  </button>
                  <div id="theme-dropdown" class="hidden absolute right-0 mt-2 py-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10">
                    <button id="theme-light" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                      <i class="ti ti-sun mr-2"></i> 浅色
                    </button>
                    <button id="theme-dark" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                      <i class="ti ti-moon mr-2"></i> 深色
                    </button>
                    <button id="theme-system" class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                      <i class="ti ti-device-desktop mr-2"></i> 跟随系统
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main class="container mx-auto px-4 py-8 max-w-3xl">
          <div class="space-y-8">
            ${content}
          </div>
        </main>

        <footer class="">
          <div class="container mx-auto px-4 py-6 max-w-3xl text-center text-gray-500 dark:text-gray-400 text-sm">
            ${footerText || CONFIG.FOOTER_TEXT}
          </div>
        </footer>

        <script>
          // 图片预览功能
          function showImage(img) {
            if (!img || !img.src) return;
            
            // 查找页面上所有可预览的图片
            const allImages = Array.from(document.querySelectorAll('img[data-preview="true"]'));
            const currentIndex = allImages.indexOf(img);
            
            // 创建模态框
            const modal = document.createElement('div');
            modal.className = 'image-modal';
            modal.style.display = 'flex';
            
            // 创建模态框内容
            const modalContent = document.createElement('div');
            modalContent.className = 'image-modal-content';
            
            // 创建图片元素
            const modalImg = document.createElement('img');
            modalImg.src = img.src;
            modalImg.alt = img.alt || '预览图片';
            
            // 创建关闭按钮
            const closeBtn = document.createElement('span');
            closeBtn.className = 'image-modal-close';
            closeBtn.innerHTML = '&times;';
            
            // 创建上一张/下一张按钮
            const prevBtn = document.createElement('span');
            prevBtn.className = 'image-modal-prev';
            prevBtn.innerHTML = '&#10094;';
            
            const nextBtn = document.createElement('span');
            nextBtn.className = 'image-modal-next';
            nextBtn.innerHTML = '&#10095;';
            
            // 组装模态框
            modalContent.appendChild(modalImg);
            modalContent.appendChild(closeBtn);
            modal.appendChild(modalContent);
            modal.appendChild(prevBtn);
            modal.appendChild(nextBtn);
            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';
            
            // 延迟添加active类以触发过渡效果
            setTimeout(() => {
              modal.classList.add('active');
            }, 10);
            
            function closeModal() {
              modal.remove();
              document.body.style.overflow = '';
            }
            
            // 显示上一张图片
            function showPrevImage() {
              currentIndex = (currentIndex - 1 + allImages.length) % allImages.length;
              modalImg.src = allImages[currentIndex].src;
            }
            
            // 显示下一张图片
            function showNextImage() {
              currentIndex = (currentIndex + 1) % allImages.length;
              modalImg.src = allImages[currentIndex].src;
            }
            
            closeBtn.addEventListener('click', closeModal);
            prevBtn.addEventListener('click', showPrevImage);
            nextBtn.addEventListener('click', showNextImage);
            
            modal.addEventListener('click', (e) => {
              if (e.target === modal) {
                closeModal();
              }
            });
            
            // 键盘事件
            document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                closeModal();
              } else if (e.key === 'ArrowLeft') {
                showPrevImage();
              } else if (e.key === 'ArrowRight') {
                showNextImage();
              }
            });
          }

          // 图片懒加载 - 使用 Intersection Observer API
          document.addEventListener('DOMContentLoaded', function() {
            if ('IntersectionObserver' in window) {
              const lazyImages = document.querySelectorAll('img[loading="lazy"]');
              
              const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                  if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                      img.src = img.dataset.src;
                      img.removeAttribute('data-src');
                    }
                    imageObserver.unobserve(img);
                  }
                });
              });

              lazyImages.forEach(img => imageObserver.observe(img));
            }
            
            // 深色模式切换功能
            const themeToggleBtn = document.getElementById('theme-toggle');
            const themeDropdown = document.getElementById('theme-dropdown');
            const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
            const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
            const themeToggleSystemIcon = document.getElementById('theme-toggle-system-icon');
            const themeLightBtn = document.getElementById('theme-light');
            const themeDarkBtn = document.getElementById('theme-dark');
            const themeSystemBtn = document.getElementById('theme-system');
            
            // 显示/隐藏下拉菜单
            themeToggleBtn.addEventListener('click', function() {
              themeDropdown.classList.toggle('hidden');
            });
            
            // 点击外部区域关闭下拉菜单
            document.addEventListener('click', function(e) {
              if (!themeToggleBtn.contains(e.target) && !themeDropdown.contains(e.target)) {
                themeDropdown.classList.add('hidden');
              }
            });
            
            // 设置主题并更新图标
            function setTheme(theme) {
              // 隐藏所有图标
              themeToggleDarkIcon.classList.add('hidden');
              themeToggleLightIcon.classList.add('hidden');
              themeToggleSystemIcon.classList.add('hidden');
              
              // 根据主题设置类和图标
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
                themeToggleLightIcon.classList.remove('hidden');
                localStorage.setItem('theme', 'dark');
              } else if (theme === 'light') {
                document.documentElement.classList.remove('dark');
                themeToggleDarkIcon.classList.remove('hidden');
                localStorage.setItem('theme', 'light');
              } else {
                // 跟随系统
                localStorage.removeItem('theme');
                themeToggleSystemIcon.classList.remove('hidden');
                
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              }
              
              // 隐藏下拉菜单
              themeDropdown.classList.add('hidden');
            }
            
            // 绑定点击事件
            themeLightBtn.addEventListener('click', () => setTheme('light'));
            themeDarkBtn.addEventListener('click', () => setTheme('dark'));
            themeSystemBtn.addEventListener('click', () => setTheme('system'));
            
            // 初始化主题
            const userTheme = localStorage.getItem('theme');
            if (userTheme === 'dark') {
              setTheme('dark');
            } else if (userTheme === 'light') {
              setTheme('light');
            } else {
              setTheme('system');
            }
            
            // 监听系统主题变化（仅当设置为跟随系统时）
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
              if (!localStorage.getItem('theme')) {
                if (e.matches) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              }
            });
          });
        </script>
      </body>
    </html>
  `;
} 