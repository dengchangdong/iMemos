import { apiHandler } from '../services/api.js';
import { createResponse } from '../utils/response.js';

/**
 * API路由处理器
 * @param {import('hono').Context} c - Hono上下文
 */
export const api = async (c) => {
  try {
    const memos = await apiHandler.fetchMemos(c);
    return createResponse(JSON.stringify(memos), 60, 200);
  } catch (error) {
    console.error('API请求失败:', error);
    return createResponse(
      JSON.stringify({ error: '获取数据失败' }),
      60,
      500
    );
  }
}; 