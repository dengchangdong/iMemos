import { formatTime, createHtml } from '../utils/index.js'
import { renderMarkdown } from '../utils/markdown.js'
import { CONFIG } from '../config.js'

export function renderMemo(memo, isHomePage = false) {
  const timestamp = memo.createTime
    ? new Date(memo.createTime).getTime()
    : memo.createdTs * 1000;
  const date = formatTime(timestamp);
  const content = memo.content || '';
  const parsedContent = renderMarkdown(content);
  const resources = memo.resources || memo.resourceList || [];
  let resourcesHtml = '';
  if (resources.length > 0) {
    const gridCols = resources.length === 1 ? 'grid-cols-1' :
      resources.length === 2 ? 'grid-cols-2' :
      'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    resourcesHtml = createHtml`
      <div class="grid ${gridCols} gap-4 mt-6">
        ${resources.map(resource => createHtml`
          <div class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer" onclick="showImage(this.querySelector('img'))">
            <img 
              src="${resource.externalLink || ''}" 
              alt="${resource.filename || '图片'}"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
              loading="lazy"
              data-preview="true"
            />
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 rounded-lg"></div>
          </div>
        `).join('')}
      </div>
    `;
  }
  const timeHtml = isHomePage
    ? createHtml`<time class="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
         <a href="/post/${memo.name}" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
           ${date}
         </a>
       </time>`
    : createHtml`<time class="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">${date}</time>`;
  return createHtml`
    <article class="${CONFIG.CSS.CARD}">
      <div class="p-6 sm:p-8">
        ${timeHtml}
        <div class="mt-4 ${CONFIG.CSS.PROSE}">
          ${parsedContent}
        </div>
        ${resourcesHtml}
      </div>
    </article>
  `;
} 