import { CONFIG } from './config'

export const apiHandler = {
  cache: new Map(),
  cacheTTL: 60 * 1000,
  async fetchMemos(c, tag = '') {
    try {
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const cacheKey = `memos_${tag}_${limit}`;
      const cachedData = this.cache.get(cacheKey);
      if (cachedData && cachedData.timestamp > Date.now() - this.cacheTTL) {
        return cachedData.data;
      }
      const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=0`;
      console.log('请求 API:', apiUrl);
      const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }
      const data = await response.json();
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      return data;
    } catch (error) {
      console.error('获取 memos 数据失败:', error);
      throw error;
    }
  },
  async fetchMemo(c, name) {
    try {
      const cacheKey = `memo_${name}`;
      const cachedData = this.cache.get(cacheKey);
      if (cachedData && cachedData.timestamp > Date.now() - this.cacheTTL) {
        return cachedData.data;
      }
      const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`;
      console.log('请求 API:', apiUrl);
      const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
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
}; 