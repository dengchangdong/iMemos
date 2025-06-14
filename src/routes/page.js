import { CONFIG } from '../config.js';
import { renderMemo, renderBaseHtml } from '../template.js';
import { utils } from '../utils.js';
import { apiHandler } from '../services/api.js';
import { createResponse, createNotFoundResponse } from '../utils/response.js';

/**
 * 分页路由处理器
 * @param {import('hono').Context} c - Hono上下文
 */
export const page = async (c) => {
  try {
    // 获取页码参数
    const pageNumber = parseInt(c.req.param('number'));
    if (isNaN(pageNumber) || pageNumber < 1) {
      return createNotFoundResponse(c);
    }
    
    // 获取指定页的数据
    const memos = await apiHandler.fetchMemos(c, '', pageNumber);
    console.log('获取到页面 memos 数量:', memos.length);

    // 如果没有数据且不是第一页，返回404
    if (memos.length === 0 && pageNumber > 1) {
      return createNotFoundResponse(c);
    }

    // 按时间降序排序memos
    const sortedMemos = utils.sortMemosByTime(memos);
    const memosHtml = sortedMemos.map(memo => renderMemo(memo, true));
    
    // 判断是否有更多数据
    const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
    const hasMore = memos.length >= limit;

    const html = renderBaseHtml(
      `第 ${pageNumber} 页 - ${c.env.SITE_NAME}`,
      memosHtml,
      c.env.NAV_LINKS,
      c.env.SITE_NAME,
      pageNumber,
      hasMore,
      true, // 这是分页列表
      '' // 无标签
    );
    
    return createResponse(html);
  } catch (error) {
    console.error('渲染分页失败:', error);
    return createNotFoundResponse(c);
  }
}; 