import { Hono } from 'hono'
import { html } from 'hono/html'

const app = new Hono()

// 错误处理中间件
app.use('*', async (c, next) => {
  try {
    await next()
  } catch (err) {
    console.error('全局错误:', err)
    return c.text('服务器错误', 500)
  }
})

// API 路由
app.get('/api/memos', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.env.PAGE_LIMIT || '10')
  const offset = (page - 1) * limit

  console.log('请求参数:', { page, limit, offset, apiHost: c.env.API_HOST })

  try {
    const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=&limit=${limit}&offset=${offset}`
    console.log('请求 API:', apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    })
    
    console.log('API 响应状态:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API 错误响应:', errorText)
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }
    
    const memos = await response.json()
    console.log('获取到 memos 数量:', memos.length)
    
    // 设置响应头
    c.header('Access-Control-Allow-Origin', '*')
    c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Content-Type')
    
    return c.json(memos)
  } catch (error) {
    console.error('API 错误:', error)
    return c.json({
      error: '加载失败',
      message: error.message,
      stack: error.stack
    }, 500)
  }
})

// 获取单个 memo
app.get('/api/memo/:name', async (c) => {
  const name = c.req.param('name')
  console.log('请求单个 memo:', name)

  try {
    const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`
    console.log('请求 API:', apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    })
    
    console.log('API 响应状态:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API 错误响应:', errorText)
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }
    
    const memo = await response.json()
    console.log('获取到 memo:', memo ? '成功' : '未找到')
    
    // 设置响应头
    c.header('Access-Control-Allow-Origin', '*')
    c.header('Access-Control-Allow-Methods', 'GET, OPTIONS')
    c.header('Access-Control-Allow-Headers', 'Content-Type')
    
    return c.json(memo)
  } catch (error) {
    console.error('API 错误:', error)
    return c.json({
      error: '加载失败',
      message: error.message,
      stack: error.stack
    }, 500)
  }
})

// 主页路由
app.get('/', async (c) => {
  try {
    const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=&limit=10&offset=0`
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
      try {
        const date = new Date(memo.createdTs * 1000).toLocaleString('zh-CN')
        const content = memo.content || ''
        const resources = memo.resourceList || []
        
        let resourcesHtml = ''
        if (resources.length > 0) {
          resourcesHtml = `
            <div class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              ${resources.map(resource => `
                <div class="relative aspect-square overflow-hidden rounded-lg">
                  <img 
                    src="${resource.externalLink || ''}" 
                    alt="${resource.filename || '图片'}"
                    class="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              `).join('')}
            </div>
          `
        }

        return `
          <article class="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
            <div class="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
              ${date}
            </div>
            <div class="text-lg leading-relaxed">
              ${content}
            </div>
            ${resourcesHtml}
          </article>
        `
      } catch (error) {
        console.error('渲染 memo 失败:', error)
        return `
          <div class="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            渲染失败: ${error.message}
          </div>
        `
      }
    }).join('')

    return html`
      <!DOCTYPE html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${c.env.SITE_NAME}</title>
          <script src="https://cdn.tailwindcss.com"></script>
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
        </head>
        <body class="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen">
          <header class="border-b border-zinc-200 dark:border-zinc-800">
            <div class="container mx-auto px-4 py-4 max-w-4xl">
              <h1 class="text-2xl font-bold">
                <a href="/" class="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
                  ${c.env.SITE_NAME}
                </a>
              </h1>
            </div>
          </header>
          
          <main class="container mx-auto px-4 py-8 max-w-4xl">
            <div class="prose dark:prose-invert max-w-none">
              ${memosHtml}
            </div>
          </main>

          <footer class="border-t border-zinc-200 dark:border-zinc-800 mt-8">
            <div class="container mx-auto px-4 py-6 max-w-4xl">
              <div class="text-center text-zinc-600 dark:text-zinc-400">
                © 2024 Memos Themes. All rights reserved.
              </div>
            </div>
          </footer>
        </body>
      </html>
    `
  } catch (error) {
    console.error('渲染页面失败:', error)
    return c.text('服务器错误', 500)
  }
})

// 单页路由
app.get('/post/:name', async (c) => {
  const name = c.req.param('name')
  console.log('请求单页:', name)
  
  try {
    const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`
    console.log('请求 API:', apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    })
    
    console.log('API 响应状态:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API 错误响应:', errorText)
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }
    
    const memo = await response.json()
    console.log('获取到 memo:', memo ? '成功' : '未找到')

    if (!memo) {
      const content = `
        <div class="flex-grow flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-2xl font-bold mb-4">未找到内容</h1>
            <a href="/" class="text-blue-500 hover:text-blue-600">返回首页</a>
          </div>
        </div>
      `
      return renderBaseHtml(c, '未找到内容', content)
    }

    const content = `
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        <article class="prose dark:prose-invert max-w-none">
          <div class="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6">
            ${renderMemo(memo)}
          </div>
        </article>
      </div>
    `

    return renderBaseHtml(c, memo.content.substring(0, 50), content)
  } catch (error) {
    console.error('API 错误:', error)
    const content = `
      <div class="flex-grow flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold mb-4">加载失败</h1>
          <p class="text-red-500 mb-4">${error.message}</p>
          <a href="/" class="text-blue-500 hover:text-blue-600">返回首页</a>
        </div>
      </div>
    `
    return renderBaseHtml(c, '加载失败', content)
  }
})

export default app 