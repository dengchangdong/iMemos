import { html } from 'hono/html'
import { createArticleStructure } from '../utils/templateUtils.js'

export function ErrorPage(error) {
  return createArticleStructure(
    html`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>`,
    html`
      <p class="text-red-600 dark:text-red-400 font-medium">加载失败</p>
      <p class="text-sm">${error.message}</p>
      <p class="mt-4">
        <a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
          返回首页
        </a>
      </p>
    `
  )
} 