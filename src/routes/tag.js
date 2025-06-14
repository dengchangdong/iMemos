import { CONFIG } from '../config.js';
import { renderMemo, renderBaseHtml } from '../template.js';
import { utils } from '../utils.js';
import { apiHandler } from '../services/api.js';
import { createResponse, createNotFoundResponse } from '../utils/response.js';

/**
 * 标签路由处理器
 * @param {import('hono').Context} c - Hono上下文
 */
export const tag = async (c) => {
  try {
    const tag = c.req.param('tag');
    
    // 获取当前页码
    const url = new URL(c.req.url);
    const pageParam = url.searchParams.get('page');
    const currentPage = pageParam ? parseInt(pageParam) : 1;
    
    const memos = await apiHandler.fetchMemos(c, tag, currentPage);
    console.log(`获取到标签 ${tag} 的 memos 数量:`, memos.length);

    // 如果没有数据且不是第一页，返回404
    if (memos.length === 0 && currentPage > 1) {
      return createNotFoundResponse(c);
    }

    // 按时间降序排序memos
    const sortedMemos = utils.sortMemosByTime(memos);
    const memosHtml = sortedMemos.map(memo => renderMemo(memo, true));
    
    // 判断是否有更多数据
    const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
    const hasMore = memos.length >= limit;

    const html = renderBaseHtml(
      `标签: ${tag} - ${c.env.SITE_NAME}`,
      memosHtml,
      c.env.NAV_LINKS,
      c.env.SITE_NAME,
      currentPage,
      hasMore,
      false, // 不是分页列表
      tag // 当前标签
    );
    
    return createResponse(html);
  } catch (error) {
    console.error('渲染标签页失败:', error);
    return createNotFoundResponse(c);
  }
}; 