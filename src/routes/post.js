import { renderMemo, renderBaseHtml } from '../templates/index.js';
import { apiHandler } from '../services/api.js';
import { createResponse, createNotFoundResponse } from '../utils/response.js';

/**
 * 文章详情路由处理器
 * @param {import('hono').Context} c - Hono上下文
 */
export const post = async (c) => {
  try {
    const name = c.req.param('name');
    const data = await apiHandler.fetchMemo(c, name);
    
    // 未找到数据
    if (!data || !data.memo) {
      return createNotFoundResponse(c);
    }

    const memoHtml = renderMemo(data.memo, false);
    const html = renderBaseHtml(
      c.env.SITE_NAME, 
      memoHtml, 
      c.env.NAV_LINKS,
      c.env.SITE_NAME
    );
    
    return createResponse(html, 1800); // 30分钟缓存
  } catch (error) {
    console.error('渲染文章页失败:', error);
    return createNotFoundResponse(c);
  }
}; 