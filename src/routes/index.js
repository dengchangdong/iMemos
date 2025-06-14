import { HomeHandler } from './HomeHandler.js'
import { PageHandler } from './PageHandler.js'
import { PostHandler } from './PostHandler.js'
import { TagHandler } from './TagHandler.js'
import { OfflinePage } from '../components/OfflinePage.js'

// 路由映射
const routes = {
  // 主页路由
  '/': async (c) => {
    const handler = new HomeHandler(c)
    return handler.handle()
  },

  // 分页路由
  '/page/:number': async (c) => {
    const handler = new PageHandler(c)
    return handler.handle()
  },

  // 文章详情页路由
  '/post/:name': async (c) => {
    const handler = new PostHandler(c)
    return handler.handle()
  },

  // 标签页路由
  '/tag/:tag': async (c) => {
    const handler = new TagHandler(c)
    return handler.handle()
  },

  // robots.txt 路由
  '/robots.txt': async () => {
    return new Response('User-agent: *\nDisallow: /', {
      headers: { 'Content-Type': 'text/plain' }
    })
  },

  // 离线页面路由
  '/offline': async (c) => {
    return new Response(OfflinePage(c.env.SITE_NAME), {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    })
  },

  // 离线图片占位符路由
  '/offline-image': async () => {
    return new Response(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      {
        headers: { 'Content-Type': 'image/png' }
      }
    )
  },

  // Service Worker 路由
  '/sw.js': async () => {
    return new Response(
      await fetch('https://raw.githubusercontent.com/your-username/memos-themes/main/src/public/sw.js').then(res => res.text()),
      {
        headers: { 'Content-Type': 'application/javascript' }
      }
    )
  }
}

export default routes 