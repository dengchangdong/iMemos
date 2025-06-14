import { CONFIG } from '../config.js'

export class MemoService {
  constructor() {
    this.cache = new Map()
    this.cacheTTL = 60 * 1000 // 1分钟缓存
  }

  // 检查缓存
  checkCache(cacheKey) {
    const cachedData = this.cache.get(cacheKey)
    if (cachedData && cachedData.timestamp > Date.now() - this.cacheTTL) {
      return cachedData.data
    }
    return null
  }

  // 更新缓存
  updateCache(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
    return data
  }

  // 获取 memos 列表
  async fetchMemos(env, tag = '', page = 1) {
    try {
      const limit = env.PAGE_LIMIT || CONFIG.PAGE_LIMIT
      const offset = (page - 1) * limit
      const cacheKey = `memos_${tag}_${limit}_${offset}`
      
      // 检查缓存
      const cachedData = this.checkCache(cacheKey)
      if (cachedData) return cachedData
      
      // 构建 API URL
      const apiUrl = `${env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=${offset}`
      console.log('请求 API:', apiUrl)

      // 发送请求
      const response = await fetch(apiUrl, { headers: CONFIG.HEADERS })
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`)
      }

      // 解析数据并更新缓存
      const data = await response.json()
      return this.updateCache(cacheKey, data)
    } catch (error) {
      console.error('获取 memos 数据失败:', error)
      throw error
    }
  }

  // 获取单条 memo
  async fetchMemo(env, name) {
    try {
      const cacheKey = `memo_${name}`
      
      // 检查缓存
      const cachedData = this.checkCache(cacheKey)
      if (cachedData) return cachedData
      
      // 构建 API URL
      const apiUrl = `${env.API_HOST}/api/v2/memos/${name}`
      console.log('请求 API:', apiUrl)

      // 发送请求
      const response = await fetch(apiUrl, { headers: CONFIG.HEADERS })
      if (!response.ok) {
        return null
      }

      // 解析数据并更新缓存
      const data = await response.json()
      return this.updateCache(cacheKey, data)
    } catch (error) {
      console.error('获取单条 memo 数据失败:', error)
      return null
    }
  }
} 