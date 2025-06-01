import { Hono } from 'hono'
import { renderBaseHtml, renderMemo } from './template'

const app = new Hono()

// 错误处理中间件
app.use('*', async (c, next) => {
  try {
    await next()
  } catch (err) {
    console.error('全局错误:', err)
    return c.json({
      error: '服务器错误',
      message: err.message,
      stack: err.stack
    }, 500)
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
  const content = `
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <div id="memo-container" class="prose dark:prose-invert max-w-none">
        <!-- Memos will be loaded here -->
      </div>
      
      <div id="loading" class="hidden flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
      </div>
    </div>

    <script>
      let currentPage = 1
      let isLoading = false
      let hasMore = true
      const memoContainer = document.getElementById('memo-container')
      const loadingIndicator = document.getElementById('loading')

      // 渲染单个 memo
      function renderMemo(memo) {
        return \`
          <article class="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div class="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
              \${new Date(memo.createdTs * 1000).toLocaleString('zh-CN')}
            </div>
            <div class="text-lg leading-relaxed">
              \${memo.content}
            </div>
            \${memo.resourceList && memo.resourceList.length > 0 ? \`
              <div class="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                \${memo.resourceList.map(resource => \`
                  <div class="relative aspect-square overflow-hidden rounded-lg cursor-zoom-in" onclick="showImageModal('\${resource.externalLink}')">
                    <img 
                      src="\${resource.externalLink}" 
                      alt="\${resource.filename}"
                      class="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                \`).join('')}
              </div>
            \` : ''}
            <div class="mt-4 text-sm text-zinc-500">
              <a href="/post/\${memo.name}" class="hover:text-zinc-700 dark:hover:text-zinc-300">
                查看详情
              </a>
            </div>
          </article>
        \`
      }

      // 加载 memos
      async function loadMemos() {
        if (isLoading || !hasMore) return
        
        isLoading = true
        loadingIndicator.classList.remove('hidden')
        
        try {
          const response = await fetch(\`${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=&limit=10&offset=\${(currentPage - 1) * 10}\`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
          })
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || \`请求失败: \${response.status}\`)
          }
          
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
          memoContainer.insertAdjacentHTML('beforeend', \`
            <div class="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              加载失败: \${error.message}
            </div>
          \`)
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
  `

  return renderBaseHtml(c, c.env.SITE_NAME, content)
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