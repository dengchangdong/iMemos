import { utils } from '../utils/index.js';

/**
 * 创建文章结构
 * @param {string} header - 文章头部HTML
 * @param {string} content - 文章内容HTML
 * @returns {string} 完整的文章HTML
 */
export const createArticleStructure = (header, content) => {
  return utils.createHtml`
    <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
      <header>${header}</header>
      <section class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
        ${content}
      </section>
    </article>
  `;
}; 