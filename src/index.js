import { Hono } from 'hono'

const app = new Hono()

// 常量配置
const DEFAULT_FOOTER_TEXT = '© 2024 Memos Themes. All rights reserved.'
const DEFAULT_PAGE_LIMIT = '10'
const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

// 错误处理中间件
app.use('*', async (c, next) => {
  try {
    await next()
  } catch (err) {
    console.error('错误:', err)
    return c.text('服务器错误', 500)
  }
})

// 格式化时间
function formatTime(timestamp) {
  const now = new Date()
  const date = new Date(timestamp)
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor(diff / (1000 * 60))

  if (days > 3) {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  }

  if (days === 1) {
    return `昨天 ${date.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`
  }

  if (days > 1) {
    return `${days} 天前`
  }

  if (hours > 0) {
    return `${hours} 小时前`
  }

  if (minutes > 0) {
    return `${minutes} 分钟前`
  }

  return '刚刚'
}

// 解析内容中的标签
function parseTags(content) {
  const tagRegex = /#([^#\s]+)/g;
  let parsedContent = content;
  const tags = [];
  let match;

  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1];
    tags.push(tag);
    parsedContent = parsedContent.replace(
      `#${tag}`,
      `<a href="/tag/${tag}" class="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">#${tag}</a>`
    );
  }

  return { parsedContent, tags };
}

// 渲染单个 memo
function renderMemo(memo, isHomePage = false) {
  try {
    const timestamp = memo.createTime 
      ? new Date(memo.createTime).getTime()
      : memo.createdTs * 1000
    const date = formatTime(timestamp)
    
    const content = memo.content || ''
    const { parsedContent } = parseTags(content)
    const resources = memo.resources || memo.resourceList || []
    
    let resourcesHtml = ''
    if (resources.length > 0) {
      const gridCols = resources.length === 1 ? 'grid-cols-1' : 
                      resources.length === 2 ? 'grid-cols-2' : 
                      'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
      
      resourcesHtml = `
        <div class="grid ${gridCols} gap-4 mt-6">
          ${resources.map(resource => `
            <div class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer" onclick="showImage(this.querySelector('img'))">
              <img 
                src="${resource.externalLink || ''}" 
                alt="${resource.filename || '图片'}"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
                loading="lazy"
                data-src="${resource.externalLink || ''}"
                data-preview="true"
              />
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 rounded-lg"></div>
            </div>
          `).join('')}
        </div>
      `
    }
    
    const timeHtml = isHomePage 
      ? `<time class="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
           <a href="/post/${memo.name}" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
             ${date}
           </a>
         </time>`
      : `<time class="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">${date}</time>`
    
    return `
      <article class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        <div class="p-6 sm:p-8">
          ${timeHtml}
          <div class="mt-4 prose dark:prose-invert max-w-none">
            <p class="text-gray-800 dark:text-gray-200 leading-relaxed">${parsedContent}</p>
          </div>
          ${resourcesHtml}
        </div>
      </article>
    `
  } catch (error) {
    console.error('渲染 memo 失败:', error)
    return `
      <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        <p class="font-medium">渲染失败</p>
        <p class="text-sm mt-1">${error.message}</p>
      </div>
    `
  }
}

// 渲染基础 HTML
function renderBaseHtml(title, content, footerText, navLinks, siteName) {
  // 解析导航链接
  let navItems = [];
  try {
    if (navLinks) {
      const linksObj = JSON.parse(navLinks);
      navItems = Object.entries(linksObj).map(([text, url]) => ({ text, url }));
    }
  } catch (error) {
    console.error('解析导航链接失败:', error);
  }

  return `
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
        <style>
          @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

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
                  ${navItems.length > 0 ? `
                    <nav class="flex items-center space-x-6">
                      ${navItems.map(item => `
                        <a href="${item.url}" class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                          ${item.text}
                        </a>
                      `).join('')}
                    </nav>
                  ` : ''}
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

          // 图片预览功能
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
            prevBtn.className = 'absolute -left-16 top-1/2 -translate-y-1/2 text-white text-4xl cursor-pointer bg-gray-800 hover:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center transition-colors';
            prevBtn.innerHTML = '<i class="ti ti-chevron-left"></i>';
            
            const nextBtn = document.createElement('button');
            nextBtn.className = 'absolute -right-16 top-1/2 -translate-y-1/2 text-white text-4xl cursor-pointer bg-gray-800 hover:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center transition-colors';
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

          // 图片懒加载
          document.addEventListener('DOMContentLoaded', function() {
            const lazyImages = document.querySelectorAll('img[data-src]');
            
            const imageObserver = new IntersectionObserver((entries, observer) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  const img = entry.target;
                  img.src = img.dataset.src;
                  img.removeAttribute('data-src');
                  observer.unobserve(img);
                }
              });
            });

            lazyImages.forEach(img => imageObserver.observe(img));
          });
        </script>
      </body>
    </html>
  `
}

// 渲染错误页面
function renderErrorPage(error, c) {
  return renderBaseHtml(
    '错误', 
    `
    <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg">
      <h2 class="text-lg font-semibold mb-2">加载失败</h2>
      <p class="text-sm">${error.message}</p>
      <a href="/" class="inline-flex items-center mt-4 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
        <i class="ti ti-arrow-left mr-1"></i>
        返回首页
      </a>
    </div>
    `,
    c.env.FOOTER_TEXT || DEFAULT_FOOTER_TEXT,
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  )
}

// 获取 memos 数据
async function fetchMemos(c, tag = '') {
  const limit = c.env.PAGE_LIMIT || DEFAULT_PAGE_LIMIT
  const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=0`
  console.log('请求 API:', apiUrl)

  const response = await fetch(apiUrl, { headers: DEFAULT_HEADERS })

  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status}`)
  }

  return response.json()
}

// 主页路由
app.get('/', async (c) => {
  try {
    const memos = await fetchMemos(c)
    console.log('获取到 memos 数量:', memos.length)

    const memosHtml = memos.map(memo => renderMemo(memo, true)).join('')

    return new Response(renderBaseHtml(
      c.env.SITE_NAME, 
      memosHtml, 
      c.env.FOOTER_TEXT || DEFAULT_FOOTER_TEXT,
      c.env.NAV_LINKS,
      c.env.SITE_NAME
    ), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  } catch (error) {
    console.error('渲染页面失败:', error)
    return new Response(renderErrorPage(error, c), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  }
})

// 单页路由
app.get('/post/:name', async (c) => {
  try {
    const name = c.req.param('name')
    const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`
    console.log('请求 API:', apiUrl)

    const response = await fetch(apiUrl, { headers: DEFAULT_HEADERS })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    if (!data || !data.memo) {
      return new Response(renderBaseHtml(
        c.env.SITE_NAME, 
        `
        <div class="text-center py-12">
          <i class="ti ti-alert-circle text-5xl text-gray-400 mb-4"></i>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">未找到内容</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-6">您访问的内容不存在或已被删除</p>
          <a href="/" class="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            <i class="ti ti-arrow-left mr-1"></i>
            返回首页
          </a>
        </div>
        `,
        c.env.FOOTER_TEXT || DEFAULT_FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8'
        }
      })
    }

    const memo = data.memo
    const memoHtml = renderMemo(memo, false)

    return new Response(renderBaseHtml(
      c.env.SITE_NAME, 
      memoHtml, 
      c.env.FOOTER_TEXT || DEFAULT_FOOTER_TEXT,
      c.env.NAV_LINKS,
      c.env.SITE_NAME
    ), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  } catch (error) {
    console.error('渲染页面失败:', error)
    return new Response(renderErrorPage(error, c), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  }
})

// 标签页面路由
app.get('/tag/:tag', async (c) => {
  try {
    const tag = c.req.param('tag')
    const memos = await fetchMemos(c, tag)
    console.log('获取到 memos 数量:', memos.length)

    const memosHtml = memos.map(memo => renderMemo(memo, true)).join('')

    return new Response(renderBaseHtml(
      `${tag} - ${c.env.SITE_NAME}`, 
      memosHtml, 
      c.env.FOOTER_TEXT || DEFAULT_FOOTER_TEXT,
      c.env.NAV_LINKS,
      c.env.SITE_NAME
    ), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  } catch (error) {
    console.error('渲染页面失败:', error)
    return new Response(renderErrorPage(error, c), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  }
})

// 修改图片缓存时间
app.get('/api/v1/memo', async (c) => {
  const response = await fetchMemos(c)
  return new Response(JSON.stringify(response), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=2592000' // 30天缓存
    }
  })
})

export default app 