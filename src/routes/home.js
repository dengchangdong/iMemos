import { CONFIG } from '../config/index.js';
import { renderMemo, renderBaseHtml } from '../templates/index.js';
import { utils } from '../utils/index.js';
import { apiHandler } from '../services/api.js';
import { createResponse, createNotFoundResponse } from '../utils/response.js';

/**
 * 主页路由处理器
 * @param {import('hono').Context} c - Hono上下文
 */
export const home = async (c) => {
  try {
    // 获取当前页码
    const url = new URL(c.req.url);
    const pageParam = url.searchParams.get('page');
    const currentPage = pageParam ? parseInt(pageParam) : 1;
    
    // 获取指定页的数据
    const memos = await apiHandler.fetchMemos(c, '', currentPage);
    console.log('获取到 memos 数量:', memos.length);

    // 按时间降序排序memos
    const sortedMemos = utils.sortMemosByTime(memos);
    const memosHtml = sortedMemos.map(memo => renderMemo(memo, true));
    
    // 判断是否有更多数据
    const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
    const hasMore = memos.length >= limit;

    const html = renderBaseHtml(
      c.env.SITE_NAME, 
      memosHtml, 
      c.env.NAV_LINKS,
      c.env.SITE_NAME,
      currentPage,
      hasMore,
      true, // 这是首页
      '' // 无标签
    );
    
    return createResponse(html);
  } catch (error) {
    console.error('渲染首页失败:', error);
    return createNotFoundResponse(c);
  }
}; 