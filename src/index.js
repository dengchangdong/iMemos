import { Hono } from 'hono'
import { html } from 'hono/html'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// 静态文件服务
app.use('/static/*', serveStatic({ root: './' }))

// 解析导航链接
function parseNavLinks(linksStr) {
  return linksStr.split(',').map(link => {
    const [name, url] = link.split(':')
    return { name, url }
  })
}

// 渲染页头
function renderHeader(siteName, navLinks) {
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
function renderFooter(footerText) {
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

// API 路由
app.get('/api/memos', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.env.PAGE_LIMIT || '10')
  const offset = (page - 1) * limit

  try {
    const response = await fetch(`${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=&limit=${limit}&offset=${offset}`)
    const memos = await response.json()
    return c.json(memos)
  } catch (error) {
    return c.json({ error: '加载失败' }, 500)
  }
})

// 获取单个 memo
app.get('/api/memo/:name', async (c) => {
  const name = c.req.param('name')
  try {
    const response = await fetch(`${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&name=${name}`)
    const memos = await response.json()
    return c.json(memos[0] || null)
  } catch (error) {
    return c.json({ error: '加载失败' }, 500)
  }
})

// 主页路由
app.get('/', async (c) => {
  return c.html(html`
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${c.env.SITE_NAME}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" rel="stylesheet">
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  zinc: {
                    50: '#fafafa',
                    100: '#f4f4f5',
                    200: '#e4e4e7',
                    300: '#d4d4d8',
                    400: '#a1a1aa',
                    500: '#71717a',
                    600: '#52525b',
                    700: '#3f3f46',
                    800: '#27272a',
                    900: '#18181b',
                    950: '#09090b',
                  }
                }
              }
            }
          }
        </script>
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
      </head>
      <body class="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen flex flex-col">
        ${renderHeader(c.env.SITE_NAME, c.env.NAV_LINKS)}
        
        <main class="flex-grow">
          <div class="container mx-auto px-4 py-8 max-w-4xl">
            <div id="memo-container" class="prose dark:prose-invert max-w-none">
              <!-- Memos will be loaded here -->
            </div>
            
            <div id="loading" class="hidden flex justify-center items-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
            </div>
          </div>
        </main>

        ${renderFooter(c.env.FOOTER_TEXT)}

        <!-- 图片预览模态框 -->
        <div id="imageModal" class="image-modal">
          <img id="modalImage" src="" alt="预览图片">
        </div>

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

          // 渲染单个 memo
          function renderMemo(memo) {
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

          let currentPage = 1
          let isLoading = false
          let hasMore = true
          const memoContainer = document.getElementById('memo-container')
          const loadingIndicator = document.getElementById('loading')

          // 加载 memos
          async function loadMemos() {
            if (isLoading || !hasMore) return
            
            isLoading = true
            loadingIndicator.classList.remove('hidden')
            
            try {
              const response = await fetch(\`/api/memos?page=\${currentPage}\`)
              const memos = await response.json()
              
              if (memos.length === 0) {
                hasMore = false
                return
              }
              
              memos.forEach(memo => {
                memoContainer.insertAdjacentHTML('beforeend', renderMemo(memo))
              })
              
              currentPage++
            } catch (error) {
              console.error('加载失败:', error)
            } finally {
              isLoading = false
              loadingIndicator.classList.add('hidden')
            }
          }

          // 监听滚动事件
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                loadMemos()
              }
            })
          }, {
            rootMargin: '100px'
          })

          observer.observe(loadingIndicator)

          // 初始加载
          loadMemos()
        </script>
      </body>
    </html>
  `)
})

// 单页路由
app.get('/post/:name', async (c) => {
  const name = c.req.param('name')
  
  try {
    const response = await fetch(`${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&name=${name}`)
    const memos = await response.json()
    const memo = memos[0]

    if (!memo) {
      return c.html(html`
        <!DOCTYPE html>
        <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>未找到内容 - ${c.env.SITE_NAME}</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen flex flex-col">
            ${renderHeader(c.env.SITE_NAME, c.env.NAV_LINKS)}
            
            <main class="flex-grow flex items-center justify-center">
              <div class="text-center">
                <h1 class="text-2xl font-bold mb-4">未找到内容</h1>
                <a href="/" class="text-blue-500 hover:text-blue-600">返回首页</a>
              </div>
            </main>

            ${renderFooter(c.env.FOOTER_TEXT)}
          </body>
        </html>
      `)
    }

    return c.html(html`
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${memo.content.substring(0, 50)}... - ${c.env.SITE_NAME}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" rel="stylesheet">
          <script>
            tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  colors: {
                    zinc: {
                      50: '#fafafa',
                      100: '#f4f4f5',
                      200: '#e4e4e7',
                      300: '#d4d4d8',
                      400: '#a1a1aa',
                      500: '#71717a',
                      600: '#52525b',
                      700: '#3f3f46',
                      800: '#27272a',
                      900: '#18181b',
                      950: '#09090b',
                    }
                  }
                }
              }
            }
          </script>
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
        </head>
        <body class="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen flex flex-col">
          ${renderHeader(c.env.SITE_NAME, c.env.NAV_LINKS)}
          
          <main class="flex-grow">
            <div class="container mx-auto px-4 py-8 max-w-4xl">
              <article class="prose dark:prose-invert max-w-none">
                <div class="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6">
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
                </div>
              </article>
            </div>
          </main>

          ${renderFooter(c.env.FOOTER_TEXT)}

          <!-- 图片预览模态框 -->
          <div id="imageModal" class="image-modal">
            <img id="modalImage" src="" alt="预览图片">
          </div>

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
        </body>
      </html>
    `)
  } catch (error) {
    return c.html(html`
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>加载失败 - ${c.env.SITE_NAME}</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen flex flex-col">
          ${renderHeader(c.env.SITE_NAME, c.env.NAV_LINKS)}
          
          <main class="flex-grow flex items-center justify-center">
            <div class="text-center">
              <h1 class="text-2xl font-bold mb-4">加载失败</h1>
              <a href="/" class="text-blue-500 hover:text-blue-600">返回首页</a>
            </div>
          </main>

          ${renderFooter(c.env.FOOTER_TEXT)}
        </body>
      </html>
    `)
  }
})

export default app 