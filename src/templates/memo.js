import { simpleMarkdown } from '../markdown.js';
import { utils } from '../utils/index.js';
import { createArticleStructure } from './article.js';
import { createResourcesHtml } from './resources.js';

/**
 * 渲染单个memo
 * @param {Object} memo - memo数据对象
 * @param {boolean} isHomePage - 是否在首页
 * @returns {string} 渲染后的HTML
 */
export const renderMemo = (memo, isHomePage = false) => {
  try {
    const timestamp = memo.createTime 
      ? new Date(memo.createTime).getTime()
      : memo.createdTs * 1000;
    
    const formattedTime = utils.formatTime(timestamp);
    const content = memo.content || '';
    const parsedContent = simpleMarkdown(content);
    const resources = memo.resources || memo.resourceList || [];
    
    // 创建图片资源HTML
    const resourcesHtml = resources.length > 0 ? createResourcesHtml(resources) : '';
    
    // 文章URL
    const articleUrl = isHomePage ? `/post/${memo.name}` : '#';
    
    // 创建文章头部
    const header = utils.createHtml`
      <a href="${articleUrl}" class="block">
        <time datetime="${new Date(timestamp).toISOString()}" class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">${formattedTime}</time>
      </a>
    `;
    
    // 创建文章内容
    const articleContent = utils.createHtml`
      ${parsedContent}
      ${resourcesHtml}
    `;
    
    return createArticleStructure(header, articleContent);
  } catch (error) {
    console.error('渲染 memo 失败:', error);
    return createArticleStructure(
      utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>`,
      utils.createHtml`<p class="text-red-500 dark:text-red-400">渲染失败: ${error.message}</p>`
    );
  }
}; 