import { Hono } from 'hono'
import { routes } from './routes.js'
import { minifyFullHtml } from './minify.js'

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

// 压缩中间件
app.use('*', async (c, next) => {
  await next()
  
  // 只压缩 HTML 响应
  const contentType = c.res.headers.get('content-type')
  if (contentType && contentType.includes('text/html')) {
    const response = await c.res.text()
    const minified = await minifyFullHtml(response)
    return c.html(minified)
  }
})

// 注册路由 - 更简洁的路由处理
app.get('/', routes.home)
app.get('/page/:number', routes.page)
app.get('/post/:name', routes.post)
app.get('/tag/:tag', routes.tag)
app.get('/api/v1/memo', routes.api)
app.get('/robots.txt', routes.robots)

export default app