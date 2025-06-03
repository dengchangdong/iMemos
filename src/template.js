import { html } from 'hono/html'
import utils from './utils.js';
import CONFIG from './config.js';
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
    <header class="border-b border-zinc-200 dark:border-zinc-800">
      <div class="container mx-auto px-4 py-4 max-w-4xl">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <h1 class="text-2xl font-bold mb-4 md:mb-0">
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
    <footer class="border-t border-zinc-200 dark:border-zinc-800 mt-8">
      <div class="container mx-auto px-4 py-6 max-w-4xl">
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

// 渲染单个 memo
export function renderMemo(memo, isHomePage = false) {
  return `
    <article class="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div class="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
        ${new Date(memo.createdTs * 1000).toLocaleString('zh-CN')}
      </div>
      <div class="text-lg leading-relaxed">
        ${memo.content}
      </div>
      ${memo.resourceList.length > 0 ? `
        <div class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          ${memo.resourceList.map(resource => `
            <div class="relative aspect-square overflow-hidden rounded-lg cursor-zoom-in" onclick="showImageModal('${resource.externalLink}')">
              <img 
                src="${resource.externalLink}" 
                alt="${resource.filename}"
                class="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          `).join('')}
        </div>
      ` : ''}
      <div class="mt-4 text-sm text-zinc-500">
        <a href="/post/${memo.name}" class="hover:text-zinc-700 dark:hover:text-zinc-300">
          查看详情
        </a>
      </div>
    </article>
  `
}

// 错误页面模板
const htmlTemplates = {
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

// 渲染基础 HTML
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
            left: -60px;
          }

          .image-modal-next {
            right: -60px;
          }

          @media (max-width: 768px) {
            .image-modal-prev {
              left: 10px;
            }
            .image-modal-next {
              right: 10px;
            }
          }

          .theme-btn {
            position: relative;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.05);
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .theme-btn:hover {
            background: rgba(0, 0, 0, 0.1);
          }

          .dark .theme-btn {
            background: rgba(255, 255, 255, 0.1);
          }

          .dark .theme-btn:hover {
            background: rgba(255, 255, 255, 0.15);
          }

          .theme-btn i {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 1.25rem;
            transition: all 0.3s ease;
          }

          .theme-btn[data-theme="system"] i.ti-device-desktop,
          .theme-btn[data-theme="light"] i.ti-sun,
          .theme-btn[data-theme="dark"] i.ti-moon {
            opacity: 1;
          }

          .theme-btn i.ti-device-desktop,
          .theme-btn i.ti-sun,
          .theme-btn i.ti-moon {
            opacity: 0;
          }

          .back-to-top {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(8px);
            border: 2px solid rgba(0, 0, 0, 0.1);
            color: #374151;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
            z-index: 40;
          }

          .back-to-top.visible {
            opacity: 1;
            transform: translateY(0);
          }

          .back-to-top:hover {
            background: rgba(255, 255, 255, 0.9);
            transform: translateY(-2px);
          }

          .dark .back-to-top {
            background: rgba(17, 24, 39, 0.8);
            border-color: rgba(255, 255, 255, 0.1);
            color: #E5E7EB;
          }

          .dark .back-to-top:hover {
            background: rgba(17, 24, 39, 0.9);
          }
        </style>
      </head>
      <body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
        <div class="flex-grow">
          <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <header class="mb-12">
              <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold tracking-tight">
                  <a href="/" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    ${siteName}
                  </a>
                </h1>
                <div class="flex items-center space-x-6">
                  ${navHtml}
                  <button class="theme-btn" data-theme="system">
                    <i class="ti ti-device-desktop"></i>
                    <i class="ti ti-sun"></i>
                    <i class="ti ti-moon"></i>
                  </button>
                </div>
              </div>
            </header>
            <main class="space-y-8">
              ${content}
            </main>
          </div>
        </div>

        <footer class="mt-12">
          <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>${footerText}</p>
            </div>
          </div>
        </footer>

        <!-- 返回顶部按钮 -->
        <button class="back-to-top" id="backToTop" aria-label="返回顶部">
          <i class="ti ti-arrow-up text-xl"></i>
        </button>

        <script>
          // 主题切换
          const themeBtn = document.querySelector('.theme-btn');
          const html = document.documentElement;
          
          // 从 localStorage 获取保存的主题
          const savedTheme = localStorage.getItem('theme') || 'system';
          setTheme(savedTheme);
          
          themeBtn.addEventListener('click', () => {
            const currentTheme = themeBtn.dataset.theme;
            let nextTheme;
            
            switch(currentTheme) {
              case 'system':
                nextTheme = 'light';
                break;
              case 'light':
                nextTheme = 'dark';
                break;
              case 'dark':
                nextTheme = 'system';
                break;
            }
            
            setTheme(nextTheme);
            localStorage.setItem('theme', nextTheme);
          });
          
          function setTheme(theme) {
            themeBtn.dataset.theme = theme;
            
            if (theme === 'system') {
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              html.classList.toggle('dark', prefersDark);
            } else {
              html.classList.toggle('dark', theme === 'dark');
            }
          }

          // 监听系统主题变化
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (themeBtn.dataset.theme === 'system') {
              html.classList.toggle('dark', e.matches);
            }
          });

          // 返回顶部
          const backToTop = document.getElementById('backToTop');
          
          window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
              backToTop.classList.add('visible');
            } else {
              backToTop.classList.remove('visible');
            }
          });
          
          backToTop.addEventListener('click', () => {
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });
          });

          // 图片预览功能 - 简化实现
          window.showImage = function(img) {
            if (!img) return;
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center';
            modal.style.display = 'flex';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'relative max-w-[90%] max-h-[90%]';
            
            const modalImg = document.createElement('img');
            modalImg.src = img.src;
            modalImg.className = 'max-w-full max-h-[90vh] object-contain rounded-lg';
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'absolute -top-12 right-0 text-white text-2xl cursor-pointer bg-gray-800 hover:bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center transition-colors';
            closeBtn.innerHTML = '<i class="ti ti-x"></i>';
            
            const prevBtn = document.createElement('button');
            prevBtn.className = 'absolute left-2 top-1/2 -translate-y-1/2 text-white text-4xl cursor-pointer bg-gray-800/50 hover:bg-gray-700/70 rounded-full w-10 h-10 flex items-center justify-center transition-colors';
            prevBtn.innerHTML = '<i class="ti ti-chevron-left"></i>';
            
            const nextBtn = document.createElement('button');
            nextBtn.className = 'absolute right-2 top-1/2 -translate-y-1/2 text-white text-4xl cursor-pointer bg-gray-800/50 hover:bg-gray-700/70 rounded-full w-10 h-10 flex items-center justify-center transition-colors';
            nextBtn.innerHTML = '<i class="ti ti-chevron-right"></i>';
            
            modalContent.appendChild(modalImg);
            modalContent.appendChild(closeBtn);
            modalContent.appendChild(prevBtn);
            modalContent.appendChild(nextBtn);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // 禁止背景滚动
            document.body.style.overflow = 'hidden';
            
            // 获取所有可预览的图片
            const allImages = Array.from(document.querySelectorAll('img[data-preview="true"]'));
            let currentIndex = allImages.indexOf(img);
            
            // 关闭模态框
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
          });
        </script>
      </body>
    </html>
  `;
}

export { renderMemo, htmlTemplates, renderBaseHtml }; 