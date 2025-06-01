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
        
        return `
          <div style="margin-bottom: 20px; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="color: #666; font-size: 14px; margin-bottom: 10px;">
              ${date}
            </div>
            <div style="font-size: 16px; line-height: 1.6;">
              ${content}
            </div>
          </div>
        `
      } catch (error) {
        console.error('渲染 memo 失败:', error)
        return `
          <div style="color: red; padding: 10px; background: #fee; border-radius: 4px;">
            渲染失败: ${error.message}
          </div>
        `
      }
    }).join('')

    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${c.env.SITE_NAME}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              line-height: 1.5;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            header {
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid #ddd;
            }
            h1 {
              margin: 0;
              font-size: 24px;
            }
            a {
              color: #0066cc;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <header>
              <h1><a href="/">${c.env.SITE_NAME}</a></h1>
            </header>
            <main>
              ${memosHtml}
            </main>
          </div>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  } catch (error) {
    console.error('渲染页面失败:', error)
    return c.text('服务器错误', 500)
  }
})

export default app 