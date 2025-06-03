/**
 * API处理模块 - 处理API请求和数据缓存
 */

import CONFIG from './config.js';

/**
 * API处理类 - 提供API请求和缓存功能
 */
class ApiHandler {
  constructor() {
    // 数据缓存
    this.cache = new Map();
    
    // 缓存TTL，默认1分钟（单位：毫秒）
    this.cacheTTL = 60 * 1000;
  }

  /**
   * 获取memos数据
   * @param {Object} c - 上下文对象
   * @param {string} tag - 标签过滤（可选）
   * @returns {Promise<Array>} memos数据数组
   */
  async fetchMemos(c, tag = '') {
    try {
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const cacheKey = `memos_${tag}_${limit}`;
      
      // 检查缓存
      const cachedData = this.cache.get(cacheKey);
      if (cachedData && cachedData.timestamp > Date.now() - this.cacheTTL) {
        return cachedData.data;
      }
      
      // 构建API URL
      const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=0`;
      console.log('请求 API:', apiUrl);

      // 发送请求
      const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      // 解析数据
      const data = await response.json();
      
      // 更新缓存
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('获取 memos 数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取单条memo
   * @param {Object} c - 上下文对象
   * @param {string} name - memo名称
   * @returns {Promise<Object|null>} memo数据或null
   */
  async fetchMemo(c, name) {
    try {
      const cacheKey = `memo_${name}`;
      
      // 检查缓存
      const cachedData = this.cache.get(cacheKey);
      if (cachedData && cachedData.timestamp > Date.now() - this.cacheTTL) {
        return cachedData.data;
      }
      
      // 构建API URL
      const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`;
      console.log('请求 API:', apiUrl);

      // 发送请求
      const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
      if (!response.ok) {
        return null;
      }

      // 解析数据
      const data = await response.json();
      
      // 更新缓存
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('获取单条 memo 数据失败:', error);
      return null;
    }
  }
}

// 创建单例实例
const apiHandler = new ApiHandler();

export default apiHandler;