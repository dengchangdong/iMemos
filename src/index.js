import { Hono } from 'hono'

const app = new Hono()

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
function renderMemo(memo) {
  try {
    const date = memo.createTime 
      ? new Date(memo.createTime).toLocaleString('zh-CN')
      : new Date(memo.createdTs * 1000).toLocaleString('zh-CN')
    
    const content = memo.content || ''
    const resources = memo.resources || memo.resourceList || []
    
    let resourcesHtml = ''
    if (resources.length > 0) {
      resourcesHtml = `
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
          ${resources.map(resource => `
            <div class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer">
              <img 
                src="${resource.externalLink || ''}" 
                alt="${resource.filename || '图片'}"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300"></div>
            </div>
          `).join('')}
        </div>
      `
    }
    
    return `
      <article class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
        <div class="p-6 sm:p-8">
          <time class="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">${date}</time>
          <div class="mt-4 prose dark:prose-invert max-w-none">
            <p class="text-gray-800 dark:text-gray-200 leading-relaxed">${content}</p>
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
function renderBaseHtml(title, content) {
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

          .prose p:first-of-type::first-letter {
            font-family: 'Noto Serif SC', serif;
            font-size: 3.5em;
            font-weight: 700;
            float: left;
            line-height: 1;
            margin-right: 0.1em;
            margin-top: 0.1em;
            color: #4B5563;
          }

          .dark .prose {
            color: #E5E7EB;
          }

          .dark .prose p:first-of-type::first-letter {
            color: #9CA3AF;
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
        </style>
      </head>
      <body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header class="flex items-center justify-between mb-12">
            <h1 class="text-3xl font-bold tracking-tight">
              <a href="/" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                ${title}
              </a>
            </h1>
            <div class="flex items-center space-x-2">
              <button class="theme-btn p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" data-theme="system">
                <i class="ti ti-device-desktop text-xl"></i>
              </button>
              <button class="theme-btn p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" data-theme="light">
                <i class="ti ti-sun text-xl"></i>
              </button>
              <button class="theme-btn p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" data-theme="dark">
                <i class="ti ti-moon text-xl"></i>
              </button>
            </div>
          </header>
          <main class="space-y-8">
            ${content}
          </main>
        </div>

        <!-- 图片预览模态框 -->
        <div class="image-modal" id="imageModal">
          <div class="image-modal-content">
            <span class="image-modal-close">&times;</span>
            <img src="" alt="预览图片">
            <div class="image-modal-prev">
              <i class="ti ti-chevron-left text-4xl"></i>
            </div>
            <div class="image-modal-next">
              <i class="ti ti-chevron-right text-4xl"></i>
            </div>
          </div>
        </div>

        <script>
          // 主题切换
          const themeBtns = document.querySelectorAll('.theme-btn');
          const html = document.documentElement;
          
          // 从 localStorage 获取保存的主题
          const savedTheme = localStorage.getItem('theme') || 'system';
          setTheme(savedTheme);
          
          themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
              const theme = btn.dataset.theme;
              setTheme(theme);
              localStorage.setItem('theme', theme);
            });
          });
          
          function setTheme(theme) {
            // 移除所有主题按钮的 active 类
            themeBtns.forEach(btn => btn.classList.remove('active'));
            
            // 为当前主题按钮添加 active 类
            const activeBtn = document.querySelector(\`[data-theme="\${theme}"]\`);
            if (activeBtn) {
              activeBtn.classList.add('active');
            }
            
            if (theme === 'system') {
              // 移除 data-theme 属性，使用系统主题
              html.removeAttribute('data-theme');
              // 监听系统主题变化
              if (window.matchMedia) {
                const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                darkModeMediaQuery.addListener((e) => {
                  html.removeAttribute('data-theme');
                });
              }
            } else {
              // 设置指定的主题
              html.setAttribute('data-theme', theme);
            }
          }

          // 图片预览
          const modal = document.getElementById('imageModal');
          const modalImg = modal.querySelector('img');
          const closeBtn = modal.querySelector('.image-modal-close');
          const prevBtn = modal.querySelector('.image-modal-prev');
          const nextBtn = modal.querySelector('.image-modal-next');
          
          let currentImageIndex = 0;
          let images = [];
          
          // 为所有图片添加点击事件
          document.addEventListener('click', (e) => {
            const imageContainer = e.target.closest('.group');
            if (imageContainer) {
              const img = imageContainer.querySelector('img');
              if (img) {
                // 获取当前页面所有图片
                images = Array.from(document.querySelectorAll('.group img')).map(img => img.src);
                currentImageIndex = images.indexOf(img.src);
                openModal(img.src);
              }
            }
          });
          
          function openModal(src) {
            modalImg.src = src;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
          }
          
          function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
          }
          
          function showImage(index) {
            if (index < 0) index = images.length - 1;
            if (index >= images.length) index = 0;
            currentImageIndex = index;
            modalImg.src = images[currentImageIndex];
          }
          
          closeBtn.addEventListener('click', closeModal);
          prevBtn.addEventListener('click', () => showImage(currentImageIndex - 1));
          nextBtn.addEventListener('click', () => showImage(currentImageIndex + 1));
          
          // 点击模态框背景关闭
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              closeModal();
            }
          });
          
          // 键盘导航
          document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('active')) return;
            
            switch(e.key) {
              case 'Escape':
                closeModal();
                break;
              case 'ArrowLeft':
                showImage(currentImageIndex - 1);
                break;
              case 'ArrowRight':
                showImage(currentImageIndex + 1);
                break;
            }
          });
        </script>
      </body>
    </html>
  `
}

// 主页路由
app.get('/', async (c) => {
  try {
    const limit = c.env.PAGE_LIMIT || '10'
    const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=&limit=${limit}&offset=0`
    console.log('请求 API:', apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const memos = await response.json()
    console.log('获取到 memos 数量:', memos.length)

    const memosHtml = memos.map(memo => {
      const memoHtml = renderMemo(memo)
      return `
        <div class="group">
          ${memoHtml}
          <div class="mt-4 text-right">
            <a href="/post/${memo.name}" class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
              <span>查看详情</span>
              <i class="ti ti-arrow-right ml-1"></i>
            </a>
          </div>
        </div>
      `
    }).join('')

    return new Response(renderBaseHtml(c.env.SITE_NAME, memosHtml), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  } catch (error) {
    console.error('渲染页面失败:', error)
    return new Response(renderBaseHtml('错误', `
      <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">加载失败</h2>
        <p class="text-sm">${error.message}</p>
        <a href="/" class="inline-flex items-center mt-4 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
          <i class="ti ti-arrow-left mr-1"></i>
          返回首页
        </a>
      </div>
    `), {
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

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    if (!data || !data.memo) {
      return new Response(renderBaseHtml('未找到内容', `
        <div class="text-center py-12">
          <i class="ti ti-alert-circle text-5xl text-gray-400 mb-4"></i>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">未找到内容</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-6">您访问的内容不存在或已被删除</p>
          <a href="/" class="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            <i class="ti ti-arrow-left mr-1"></i>
            返回首页
          </a>
        </div>
      `), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8'
        }
      })
    }

    const memo = data.memo
    const memoHtml = renderMemo(memo)
    const title = memo.content ? (memo.content.substring(0, 50) + (memo.content.length > 50 ? '...' : '')) : '无标题'

    return new Response(renderBaseHtml(title, memoHtml), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  } catch (error) {
    console.error('渲染页面失败:', error)
    return new Response(renderBaseHtml('加载失败', `
      <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">加载失败</h2>
        <p class="text-sm">${error.message}</p>
        <a href="/" class="inline-flex items-center mt-4 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
          <i class="ti ti-arrow-left mr-1"></i>
          返回首页
        </a>
      </div>
    `), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  }
})

export default app 