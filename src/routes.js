import { CONFIG } from './config.js'
import { utils } from './utils.js'
import { renderBaseHtml, renderErrorPage, renderNotFoundPage, renderMemo } from './templates.js'
import { fetchMemos, fetchMemo, fetchTags } from './api.js'

// 错误处理中间件
export function errorHandler(c, error) {
  console.error('路由错误:', error)
  return c.html(renderBaseHtml(c, '错误', renderErrorPage(error)))
}

// 首页路由
export async function home(c) {
  try {
    const data = await fetchMemos(c)
    const content = data.data.map(memo => renderMemo(memo, true)).join('')
    
    return c.html(renderBaseHtml(c, '首页', `
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        ${content}
      </div>
    `))
  } catch (error) {
    return errorHandler(c, error)
  }
}

// 文章详情页路由
export async function post(c) {
  try {
    const id = c.req.param('id')
    const data = await fetchMemo(c, id)
    const content = renderMemo(data)
    
    return c.html(renderBaseHtml(c, '文章详情', `
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        ${content}
      </div>
    `))
  } catch (error) {
    if (error.message === 'Memo不存在') {
      return c.html(renderBaseHtml(c, '404', renderNotFoundPage()))
    }
    return errorHandler(c, error)
  }
}

// 标签页路由
export async function tag(c) {
  try {
    const tag = c.req.param('tag')
    const data = await fetchMemos(c, tag)
    const content = data.data.map(memo => renderMemo(memo, true)).join('')
    
    return c.html(renderBaseHtml(c, `标签: ${tag}`, `
      <div class="container mx-auto px-4 py-8 max-w-4xl">
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            标签: ${tag}
          </h1>
        </div>
        ${content}
      </div>
    `))
  } catch (error) {
    return errorHandler(c, error)
  }
}

// API路由
export async function api(c) {
  try {
    const path = c.req.path.replace('/api', '')
    const response = await fetch(`${c.env.API_BASE_URL}${path}`, {
      headers: CONFIG.HEADERS
    })
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    return c.json(data)
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
}

// 离线页面路由
export function offline(c) {
  return c.html(`
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>离线 - ${c.env.SITE_NAME}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" rel="stylesheet">
      </head>
      <body class="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen flex items-center justify-center">
        <div class="text-center p-8">
          <i class="ti ti-wifi-off text-5xl text-gray-400 mb-4"></i>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">您当前处于离线状态</h1>
          <p class="text-gray-500 dark:text-gray-400 mb-6">请检查网络连接后重试</p>
          <button onclick="window.location.reload()" class="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <i class="ti ti-refresh mr-2"></i>
            重新加载
          </button>
        </div>
      </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=2592000'
    }
  })
} 