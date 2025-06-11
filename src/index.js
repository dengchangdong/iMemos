import { Hono } from 'hono'
import { routes } from './routes.js'

const app = new Hono()

// 错误处理中间件 - 简化错误处理
app.use('*', async (c, next) => {
  try {
    return await next()
  } catch (err) {
    console.error('错误:', err)
    return c.text('服务器错误', 500)
  }
})

// 注册路由 - 使用对象映射简化路由注册
const routeMap = {
  '/': routes.home,
  '/page/:number': routes.page,
  '/post/:name': routes.post,
  '/tag/:tag': routes.tag,
  '/api/v1/memo': routes.api,
  '/offline.html': routes.offline,
  '/offline-image.png': routes.offlineImage,
  '/robots.txt': routes.robots
}

// 批量注册路由
Object.entries(routeMap).forEach(([path, handler]) => {
  app.get(path, handler)
})

export default app