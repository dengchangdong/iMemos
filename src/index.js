import { Hono } from 'hono'
import { routes } from './routes.js'
import { logger } from 'hono/logger'
import { timing } from 'hono/timing'

const app = new Hono()

// 请求计时
app.use('*', timing())

// 日志记录（仅在开发环境）
if (process.env.NODE_ENV !== 'production') {
  app.use('*', logger())
}

// 错误处理中间件
app.use('*', async (c, next) => {
  try {
    await next()
  } catch (err) {
    console.error('错误:', err)
    
    // 根据错误类型返回不同状态码
    const status = err.status || 500
    const message = status === 404 ? '未找到请求的资源' : '服务器错误'
    
    return c.text(message, status)
  }
})

// 注册路由 - 更简洁的路由处理
app.get('/', routes.home)
app.get('/page/:number', routes.page)
app.get('/post/:name', routes.post)
app.get('/tag/:tag', routes.tag)
app.get('/api/v1/memo', routes.api)

// 离线页面
app.get('/offline.html', routes.offline)

// 离线图片占位符
app.get('/offline-image.png', routes.offlineImage)

// favicon.ico
app.get('/favicon.ico', routes.favicon)

// robots.txt路由
app.get('/robots.txt', routes.robots)

// 404处理
app.notFound((c) => {
  return c.text('未找到请求的资源', 404)
})

export default app