import { CONFIG } from '../config/index.js';

/**
 * API处理器类
 */
class APIHandler {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 60 * 1000; // 1分钟缓存
  }

  /**
   * 检查缓存
   * @param {string} cacheKey - 缓存键
   * @returns {any|null} 缓存的数据或null
   */
  checkCache(cacheKey) {
    const cachedData = this.cache.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - this.cacheTTL) {
      return cachedData.data;
    }
    return null;
  }

  /**
   * 更新缓存
   * @param {string} cacheKey - 缓存键
   * @param {any} data - 要缓存的数据
   * @returns {any} 缓存的数据
   */
  updateCache(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    return data;
  }

  /**
   * 获取memos数据
   * @param {import('hono').Context} c - Hono上下文
   * @param {string} tag - 标签
   * @param {number} page - 页码
   * @returns {Promise<any>} memos数据
   */
  async fetchMemos(c, tag = '', page = 1) {
    try {
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const offset = (page - 1) * limit;
      const cacheKey = `memos_${tag}_${limit}_${offset}`;
      
      // 检查缓存
      const cachedData = this.checkCache(cacheKey);
      if (cachedData) return cachedData;
      
      // 构建API URL
      const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=${offset}`;
      console.log('请求 API:', apiUrl);

      // 发送请求
      const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      // 解析数据并更新缓存
      const data = await response.json();
      return this.updateCache(cacheKey, data);
    } catch (error) {
      console.error('获取 memos 数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取单条memo
   * @param {import('hono').Context} c - Hono上下文
   * @param {string} name - memo名称
   * @returns {Promise<any>} memo数据
   */
  async fetchMemo(c, name) {
    try {
      const cacheKey = `memo_${name}`;
      
      // 检查缓存
      const cachedData = this.checkCache(cacheKey);
      if (cachedData) return cachedData;
      
      // 构建API URL
      const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`;
      console.log('请求 API:', apiUrl);

      // 发送请求
      const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
      if (!response.ok) {
        return null;
      }

      // 解析数据并更新缓存
      const data = await response.json();
      return this.updateCache(cacheKey, data);
    } catch (error) {
      console.error('获取单条 memo 数据失败:', error);
      return null;
    }
  }
}

export const apiHandler = new APIHandler(); 