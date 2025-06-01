import { Hono } from 'hono'
import { renderBaseHtml, renderMemo } from './template'

const app = new Hono()

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
            memoContainer.insertAdjacentHTML('beforeend', \`${renderMemo.toString()}\`(memo))
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
  `

  return renderBaseHtml(c, c.env.SITE_NAME, content)
})

// 单页路由
app.get('/post/:name', async (c) => {
  const name = c.req.param('name')
  
  try {
    const response = await fetch(`${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&name=${name}`)
    const memos = await response.json()
    const memo = memos[0]

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
    const content = `
      <div class="flex-grow flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold mb-4">加载失败</h1>
          <a href="/" class="text-blue-500 hover:text-blue-600">返回首页</a>
        </div>
      </div>
    `
    return renderBaseHtml(c, '加载失败', content)
  }
})

export default app 