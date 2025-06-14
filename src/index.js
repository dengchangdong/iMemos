import { Hono } from 'hono'
import { routes } from './routes.js'

const app = new Hono()

// 全局错误处理中间件
app.use('*', async (c, next) => {
  try {
    await next()
  } catch (error) {
    console.error('服务器错误:', error)
    return c.text('服务器内部错误', 500)
  }
})

// 路由注册
const routeHandlers = {
  '/': routes.home,
  '/page/:number': routes.page,
  '/post/:name': routes.post,
  '/tag/:tag': routes.tag,
  '/api/v1/memo': routes.api,
  '/offline.html': routes.offline,
  '/offline-image.png': routes.offlineImage,
  '/robots.txt': routes.robots,
}

// 使用 Object.entries 批量注册路由
Object.entries(routeHandlers).forEach(([path, handler]) => {
  app.get(path, handler)
})

export default app