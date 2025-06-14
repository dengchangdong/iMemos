import { createArticleStructure } from './article.js';
import { utils } from '../utils/index.js';

/**
 * 404页面模板
 * @returns {string} HTML字符串
 */
export const notFoundPage = () => {
  return createArticleStructure(
    utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">404</time>`,
    utils.createHtml`
      <h2 class="font-medium">未找到内容</h2>
      <p>您访问的内容不存在或已被删除</p>
      <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
    `
  );
}; 