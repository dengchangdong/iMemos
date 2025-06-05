import { Hono } from 'hono'
import CONFIG from './config.js';
import { routes } from './routes.js';
import { simpleMarkdown } from './markdown.js';

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

// 注册路由 - 更简洁的路由处理
app.get('/', routes.home);
app.get('/post/:name', routes.post);
app.get('/tag/:tag', routes.tag);
app.get('/api/v1/memo', routes.api);

// 离线页面
app.get('/offline.html', routes.offline);

export default app 