import { CONFIG } from '../config.js'

const cache = new Map();
const cacheTTL = 60 * 1000;

export async function fetchMemos(c, tag = '') {
  const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
  const cacheKey = `memos_${tag}_${limit}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData && cachedData.timestamp > Date.now() - cacheTTL) {
    return cachedData.data;
  }
  const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=0`;
  const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
  if (!response.ok) throw new Error(`API 请求失败: ${response.status}`);
  const data = await response.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

export async function fetchMemo(c, name) {
  const cacheKey = `memo_${name}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData && cachedData.timestamp > Date.now() - cacheTTL) {
    return cachedData.data;
  }
  const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`;
  const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
  if (!response.ok) return null;
  const data = await response.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
} 