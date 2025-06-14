import { Hono } from 'hono'
import { serveStatic } from 'hono/serve-static'
import { CONFIG } from './config.js'
import { routes } from './routes.js'

/**
 * 创建Hono应用实例
 * @type {Hono}
 */
const app = new Hono()

/**
 * 注册路由
 */
app.get('/', routes.home)
app.get('/page/:number', routes.page)
app.get('/post/:name', routes.post)
app.get('/tag/:tag', routes.tag)
app.get('/robots.txt', routes.robots)
app.get('/api', routes.api)

/**
 * 静态资源处理
 */
app.use('/*', serveStatic({ root: './' }))

/**
 * 导出应用实例
 */
export default app