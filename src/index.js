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
    const date = new Date(memo.createTime).toLocaleString('zh-CN')
    const content = memo.content || ''
    const resources = memo.resources || []
    
    let resourcesHtml = ''
    if (resources.length > 0) {
      resourcesHtml = `
        <div style="margin-top: 15px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
          ${resources.map(resource => `
            <div style="position: relative; padding-bottom: 100%; overflow: hidden; border-radius: 8px;">
              <img 
                src="${resource.externalLink || ''}" 
                alt="${resource.filename || '图片'}"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                loading="lazy"
              />
            </div>
          `).join('')}
        </div>
      `
    }
    
    return `
      <div style="margin-bottom: 20px; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="color: #666; font-size: 14px; margin-bottom: 10px;">
          ${date}
        </div>
        <div style="font-size: 16px; line-height: 1.6;">
          ${content}
        </div>
        ${resourcesHtml}
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
}

// 渲染基础 HTML
function renderBaseHtml(title, content) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
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
          img {
            transition: transform 0.3s ease;
          }
          img:hover {
            transform: scale(1.05);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1><a href="/">${title}</a></h1>
          </header>
          <main>
            ${content}
          </main>
        </div>
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
        <div style="margin-bottom: 20px;">
          ${memoHtml}
          <div style="text-align: right; margin-top: 10px;">
            <a href="/post/${memo.name}" style="color: #666; font-size: 14px;">查看详情</a>
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
    return c.text('服务器错误', 500)
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
        <div style="text-align: center; padding: 40px 20px;">
          <h2 style="margin-bottom: 20px;">未找到内容</h2>
          <a href="/">返回首页</a>
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
      <div style="text-align: center; padding: 40px 20px;">
        <h2 style="margin-bottom: 20px;">加载失败</h2>
        <p style="color: red; margin-bottom: 20px;">${error.message}</p>
        <a href="/">返回首页</a>
      </div>
    `), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  }
})

export default app 