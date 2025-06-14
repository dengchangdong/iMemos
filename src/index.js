import { Hono } from 'hono'
import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './middleware/logger.js'
import { routes } from './routes/index.js'

const app = new Hono()

// 注册全局中间件
app.use('*', logger)
app.use('*', errorHandler)

// 注册路由
const {
  home,
  page,
  post,
  tag,
  api,
  offline,
  offlineImage,
  robots
} = routes

// 主页路由
app.get('/', home)

// 分页路由
app.get('/page/:number', page)

// 文章详情路由
app.get('/post/:name', post)

// 标签路由
app.get('/tag/:tag', tag)

// API路由
app.get('/api/v1/memo', api)

// 离线页面路由
app.get('/offline.html', offline)

// 离线图片路由
app.get('/offline-image.png', offlineImage)

// robots.txt路由
app.get('/robots.txt', robots)

export default app