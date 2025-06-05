import { Hono } from 'hono'
import { home, post, tag, api, offline, errorHandler } from './routes.js'

const app = new Hono()

// 注册路由
app.get('/', home)
app.get('/memo/:id', post)
app.get('/tag/:tag', tag)
app.get('/api/*', api)
app.get('/offline.html', offline)

// 错误处理
app.onError(errorHandler)

export default app 