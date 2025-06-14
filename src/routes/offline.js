import { renderBaseHtml } from '../templates/index.js';
import { createResponse } from '../utils/response.js';

/**
 * 离线页面路由处理器
 * @param {import('hono').Context} c - Hono上下文
 */
export const offline = (c) => {
  const html = renderBaseHtml(
    '离线 - ' + c.env.SITE_NAME,
    '<div class="text-center py-8"><h1 class="text-2xl font-bold mb-4">您当前处于离线状态</h1><p>请检查您的网络连接后重试。</p></div>',
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  );
  return createResponse(html, 3600); // 1小时缓存
}; 