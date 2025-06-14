import { html } from 'hono/html'
import { createArticleStructure } from '../utils/templateUtils.js'

export function NotFoundPage() {
  return createArticleStructure(
    html`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">404</time>`,
    html`
      <h2 class="font-medium">未找到内容</h2>
      <p>您访问的内容不存在或已被删除</p>
      <p class="mt-4">
        <a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
          返回首页
        </a>
      </p>
    `
  )
} 