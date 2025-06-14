import { html } from 'hono/html'
import { OptimizedImage, previewScript } from '../components/OptimizedImage.js'

// 创建文章结构
export function createArticleStructure(header, content) {
  return html`
    <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
      <header>${header}</header>
      <section class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
        ${content}
      </section>
    </article>
  `
}

// 解析导航链接
export function parseNavLinks(linksStr) {
  if (!linksStr) return []
  try {
    const jsonStr = linksStr.replace(/'/g, '"')
    const linksObj = JSON.parse(jsonStr)
    return Object.entries(linksObj).map(([text, url]) => ({ text, url }))
  } catch (error) {
    console.error('解析导航链接失败:', error)
    return []
  }
}

// 创建资源HTML
export function createResourcesHtml(resources) {
  if (!resources || resources.length === 0) return ''

  const resourcesHtml = resources.length === 1
    ? createSingleResourceHtml(resources[0])
    : resources.length === 2
      ? createDoubleResourceHtml(resources)
      : createMultipleResourceHtml(resources)

  return html`
    ${resourcesHtml}
    ${previewScript}
  `
}

function createSingleResourceHtml(resource) {
  return html`
    <figure class="mt-4">
      ${OptimizedImage({
        src: resource.externalLink || '',
        alt: resource.filename || '图片',
        aspectRatio: 'aspect-video'
      })}
    </figure>
  `
}

function createDoubleResourceHtml(resources) {
  return html`
    <figure class="mt-4">
      <div class="flex flex-wrap gap-1">
        ${resources.map(resource => html`
          <div class="w-[calc(50%-2px)]">
            ${OptimizedImage({
              src: resource.externalLink || '',
              alt: resource.filename || '图片',
              aspectRatio: 'aspect-square'
            })}
          </div>
        `).join('')}
      </div>
    </figure>
  `
}

function createMultipleResourceHtml(resources) {
  return html`
    <figure class="mt-4">
      <div class="grid grid-cols-3 gap-1">
        ${resources.map(resource => html`
          <div>
            ${OptimizedImage({
              src: resource.externalLink || '',
              alt: resource.filename || '图片',
              aspectRatio: 'aspect-square'
            })}
          </div>
        `).join('')}
      </div>
    </figure>
  `
} 