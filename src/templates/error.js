import { createArticleStructure } from './article.js';
import { utils } from '../utils.js';

/**
 * 错误页面模板
 * @param {Error} error - 错误对象
 * @returns {string} HTML字符串
 */
export const errorPage = (error) => {
  return createArticleStructure(
    utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>`,
    utils.createHtml`
      <p class="text-red-600 dark:text-red-400 font-medium">加载失败</p>
      <p class="text-sm">${error.message}</p>
      <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
    `
  );
}; 