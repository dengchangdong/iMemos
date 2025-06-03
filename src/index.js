import { Hono } from 'hono'
import { utils } from './utils.js'
import { CONFIG } from './config.js'
import { markdownRenderer, simpleMarkdown } from './markdown.js'

const app = new Hono()

// 配置已移至config.js

// 错误处理中间件
app.use('*', async (c, next) => {
  try {
    await next()
  } catch (err) {
    console.error('错误:', err)
    return c.text('服务器错误', 500)
  }
})

// 渲染单个 memo
function renderMemo(memo, isHomePage = false) {
  try {
    const timestamp = memo.createTime 
      ? new Date(memo.createTime).getTime()
      : memo.createdTs * 1000;
    const date = utils.formatTime(timestamp);
    
    // 使用简易Markdown渲染内容
    const content = memo.content || '';
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

// 优化HTML模板渲染 - 减少重复代码
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

// 渲染基础 HTML - 优化CSS加载和脚本处理
function renderBaseHtml(title, content, footerText, navLinks, siteName) {
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
          // 注册Service Worker
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                  console.log('Service Worker 注册成功:', registration.scope);
                })
                .catch(error => {
                  console.error('Service Worker 注册失败:', error);
                });
            });
          }
          
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

// 统一路由错误处理
function renderErrorPage(error, c) {
  return renderBaseHtml(
    '错误', 
    htmlTemplates.errorPage(error),
    c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  );
}

// API处理相关 - 优化HTTP请求和缓存
const apiHandler = {
  // 数据缓存
  cache: new Map(),
  
  // 缓存TTL，默认1分钟（单位：毫秒）
  cacheTTL: 60 * 1000,

  // 获取memos数据
  async fetchMemos(c, tag = '') {
    try {
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const cacheKey = `memos_${tag}_${limit}`;
      
      // 检查缓存
      const cachedData = this.cache.get(cacheKey);
      if (cachedData && cachedData.timestamp > Date.now() - this.cacheTTL) {
        return cachedData.data;
      }
      
      // 构建API URL
      const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=0`;
      console.log('请求 API:', apiUrl);

      // 发送请求
      const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      // 解析数据
      const data = await response.json();
      
      // 更新缓存
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('获取 memos 数据失败:', error);
      throw error;
    }
  },
  
  // 获取单条memo
  async fetchMemo(c, name) {
    try {
      const cacheKey = `memo_${name}`;
      
      // 检查缓存
      const cachedData = this.cache.get(cacheKey);
      if (cachedData && cachedData.timestamp > Date.now() - this.cacheTTL) {
        return cachedData.data;
      }
      
      // 构建API URL
      const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`;
      console.log('请求 API:', apiUrl);

      // 发送请求
      const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
      if (!response.ok) {
        return null;
      }

      // 解析数据
      const data = await response.json();
      
      // 更新缓存
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('获取单条 memo 数据失败:', error);
      return null;
    }
  }
};

// 路由处理 - 优化路由模块化
const routes = {
  // 主页路由处理
  async home(c) {
    try {
      const memos = await apiHandler.fetchMemos(c);
      console.log('获取到 memos 数量:', memos.length);

      const memosHtml = memos.map(memo => renderMemo(memo, true)).join('');

      return new Response(renderBaseHtml(
        c.env.SITE_NAME, 
        memosHtml, 
        c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=300' // 5分钟缓存
        }
      });
    } catch (error) {
      console.error('渲染首页失败:', error);
      return new Response(renderErrorPage(error, c), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        status: 500
      });
    }
  },
  
  // 单页路由处理
  async post(c) {
    try {
      const name = c.req.param('name');
      const data = await apiHandler.fetchMemo(c, name);
      
      // 未找到数据
      if (!data || !data.memo) {
        return new Response(renderBaseHtml(
          c.env.SITE_NAME, 
          htmlTemplates.notFoundPage(),
          c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' },
          status: 404
        });
      }

      const memoHtml = renderMemo(data.memo, false);

      return new Response(renderBaseHtml(
        c.env.SITE_NAME, 
        memoHtml, 
        c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=1800' // 30分钟缓存
        }
      });
    } catch (error) {
      console.error('渲染文章页失败:', error);
      return new Response(renderErrorPage(error, c), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        status: 500
      });
    }
  },
  
  // 标签页路由处理
  async tag(c) {
    try {
      const tag = c.req.param('tag');
      const memos = await apiHandler.fetchMemos(c, tag);
      console.log('获取到标签页 memos 数量:', memos.length);

      const memosHtml = memos.map(memo => renderMemo(memo, true)).join('');

      return new Response(renderBaseHtml(
        `${tag} - ${c.env.SITE_NAME}`, 
        memosHtml, 
        c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=300' // 5分钟缓存
        }
      });
    } catch (error) {
      console.error('渲染标签页失败:', error);
      return new Response(renderErrorPage(error, c), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        status: 500
      });
    }
  },
  
  // API代理 - 用于缓存资源
  async api(c) {
    try {
      const memos = await apiHandler.fetchMemos(c);
      return new Response(JSON.stringify(memos), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=2592000' // 30天缓存
        }
      });
    } catch (error) {
      console.error('API代理失败:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }
};

// 注册路由 - 更简洁的路由处理
app.get('/', routes.home);
app.get('/post/:name', routes.post);
app.get('/tag/:tag', routes.tag);
app.get('/api/v1/memo', routes.api);

// Service Worker相关路由
app.get('/sw.js', async (c) => {
  // 直接返回 sw.js 文件内容
  const swContent = `// 缓存版本号 - 修改此值以更新缓存
const CACHE_VERSION = 'v1';
const CACHE_NAME = \`imemos-cache-\${CACHE_VERSION}\`;

// 需要缓存的资源
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/offline-image.png'
];

// 动态缓存API响应的最大时间 (24小时)
const API_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

// 安装Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存静态资源');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('imemos-cache-') && cacheName !== CACHE_NAME;
        }).map((cacheName) => {
          console.log(\`删除旧缓存: \${cacheName}\`);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  // 跳过不支持缓存的请求
  if (!event.request.url.startsWith('http')) return;
  
  // 处理API请求 (适用缓存策略)
  if (event.request.url.includes('/api/')) {
    return event.respondWith(handleApiRequest(event.request));
  }
  
  // 处理静态资源
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 如果缓存中有，则返回缓存
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 没有缓存则网络请求
        return fetch(event.request)
          .then((response) => {
            // 不缓存错误响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 缓存资源
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // 离线回退处理 - 对图片返回占位图
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              return caches.match('/offline-image.png');
            }
            
            // 对HTML页面返回离线页面
            if (event.request.headers.get('Accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            // 其他资源直接返回错误
            return new Response('网络连接失败', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// 处理API请求的缓存策略
async function handleApiRequest(request) {
  // 尝试获取缓存
  try {
    const cachedResponse = await caches.match(request);
    
    // 检查缓存是否存在且未过期
    if (cachedResponse) {
      const cachedDate = new Date(cachedResponse.headers.get('sw-cache-date'));
      const now = new Date();
      
      // 如果缓存未过期，直接返回缓存
      if (now.getTime() - cachedDate.getTime() < API_CACHE_MAX_AGE) {
        return cachedResponse;
      }
    }
    
    // 缓存不存在或已过期，发起网络请求
    const response = await fetch(request);
    
    // 请求成功，更新缓存
    if (response.ok) {
      const clonedResponse = response.clone();
      
      // 添加缓存时间戳
      const headers = new Headers(clonedResponse.headers);
      headers.append('sw-cache-date', new Date().toISOString());
      
      // 创建新的响应对象
      const cachedResponse = new Response(
        await clonedResponse.blob(),
        {
          status: clonedResponse.status,
          statusText: clonedResponse.statusText,
          headers: headers
        }
      );
      
      // 存入缓存
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, cachedResponse);
      
      return response;
    }
    
    // 如果请求失败但有缓存，返回过期的缓存
    if (cachedResponse) {
      console.log('API请求失败，使用过期缓存');
      return cachedResponse;
    }
    
    // 没有缓存且请求失败，返回错误响应
    return response;
  } catch (error) {
    console.error('API请求处理错误:', error);
    
    // 尝试使用任何可用的缓存
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 完全失败，返回错误响应
    return new Response(JSON.stringify({ error: '网络连接失败' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}`;

  return new Response(swContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache'
    }
  });
});

// 离线页面
app.get('/offline.html', (c) => {
  return new Response(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>离线 - ${c.env.SITE_NAME || '博客'}</title>
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
  `, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=2592000'
    }
  });
});

// 离线图片占位符
app.get('/offline-image.png', (c) => {
  // 提供简单的Base64编码的1x1像素透明PNG作为占位符
  const transparentPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  return new Response(Buffer.from(transparentPixel, 'base64'), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=2592000'
    }
  });
});

export default app