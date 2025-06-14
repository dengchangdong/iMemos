import { renderBaseHtml, htmlTemplates } from '../templates/index.js';

/**
 * 创建统一的响应对象
 * @param {string} html - HTML内容
 * @param {number} cacheTime - 缓存时间（秒）
 * @param {number} status - HTTP状态码
 * @returns {Response}
 */
export const createResponse = (html, cacheTime = 300, status = 200) => {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': `public, max-age=${cacheTime}`
    },
    status
  });
};

/**
 * 创建404响应
 * @param {import('hono').Context} c - Hono上下文
 * @returns {Response}
 */
export const createNotFoundResponse = (c) => {
  const notFoundHtml = renderBaseHtml(
    c.env.SITE_NAME, 
    htmlTemplates.notFoundPage(),
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  );
  return createResponse(notFoundHtml, 300, 404);
};

/**
 * 创建错误页面响应
 * @param {Error} error - 错误对象
 * @param {import('hono').Context} c - Hono上下文
 * @returns {Response}
 */
export const createErrorResponse = (error, c) => {
  const errorHtml = renderBaseHtml(
    '错误', 
    htmlTemplates.errorPage(error),
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  );
  return createResponse(errorHtml, 300, 500);
}; 