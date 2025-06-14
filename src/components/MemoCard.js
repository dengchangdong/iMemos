import { html } from 'hono/html'
import { createArticleStructure, createResourcesHtml } from '../utils/templateUtils.js'
import { simpleMarkdown } from '../markdown.js'
import { formatTime } from '../utils.js'

export function MemoCard(memo, isHomePage = false) {
  try {
    const timestamp = memo.createTime 
      ? new Date(memo.createTime).getTime()
      : memo.createdTs * 1000
    
    const formattedTime = formatTime(timestamp)
    const content = memo.content || ''
    const parsedContent = simpleMarkdown(content)
    const resources = memo.resources || memo.resourceList || []
    
    // 创建图片资源HTML
    const resourcesHtml = createResourcesHtml(resources)
    
    // 文章URL
    const articleUrl = isHomePage ? `/post/${memo.name}` : '#'
    
    // 创建文章头部
    const header = html`
      <a href="${articleUrl}" class="block">
        <time 
          datetime="${new Date(timestamp).toISOString()}" 
          class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
        >
          ${formattedTime}
        </time>
      </a>
    `
    
    // 创建文章内容
    const articleContent = html`
      ${parsedContent}
      ${resourcesHtml}
    `
    
    return createArticleStructure(header, articleContent)
  } catch (error) {
    console.error('渲染 memo 失败:', error)
    return createArticleStructure(
      html`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>`,
      html`<p class="text-red-500 dark:text-red-400">渲染失败: ${error.message}</p>`
    )
  }
} 