import { CONFIG } from './config.js'

// API请求函数
export async function fetchMemos(c, tag = '') {
  const url = tag 
    ? `${c.env.API_BASE_URL}/api/v1/memo?tag=${encodeURIComponent(tag)}&limit=${CONFIG.PAGE_LIMIT}`
    : `${c.env.API_BASE_URL}/api/v1/memo?limit=${CONFIG.PAGE_LIMIT}`
  
  try {
    const response = await fetch(url, {
      headers: CONFIG.HEADERS
    })
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('获取Memo列表失败:', error)
    throw error
  }
}

// 获取单个Memo
export async function fetchMemo(c, id) {
  try {
    const response = await fetch(`${c.env.API_BASE_URL}/api/v1/memo/${id}`, {
      headers: CONFIG.HEADERS
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Memo不存在')
      }
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('获取Memo详情失败:', error)
    throw error
  }
}

// 获取标签列表
export async function fetchTags(c) {
  try {
    const response = await fetch(`${c.env.API_BASE_URL}/api/v1/tag`, {
      headers: CONFIG.HEADERS
    })
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('获取标签列表失败:', error)
    throw error
  }
} 