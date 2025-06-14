import { Hono } from 'hono'
import routes from './routes/index.js'
import { BaseHandler } from './routes/BaseHandler.js'

const app = new Hono()

// 注册路由
Object.entries(routes).forEach(([path, handler]) => {
  app.get(path, handler)
})

// 404 处理
app.notFound((c) => {
  const handler = new BaseHandler(c)
  return handler.renderNotFoundPage()
})

// 错误处理
app.onError((err, c) => {
  console.error('应用错误:', err)
  const handler = new BaseHandler(c)
  return handler.renderErrorPage(err)
})

export default app