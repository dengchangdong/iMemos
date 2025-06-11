import { CONFIG } from './config.js';
import { renderMemo } from './template.js';
import { renderBaseHtml } from './template.js';
import { simpleMarkdown } from './markdown.js';
import { htmlTemplates } from './template.js';

// 统一路由错误处理
export function renderErrorPage(error, c) {
  return renderBaseHtml(
    '错误', 
    htmlTemplates.errorPage(error),
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  );
}

// API处理相关 - 优化HTTP请求和缓存
export const apiHandler = {
  // 数据缓存
  cache: new Map(),
  
  // 缓存TTL，默认1分钟（单位：毫秒）
  cacheTTL: CONFIG.API.CACHE_TTL || 60 * 1000,
  
  // 清理过期缓存
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.timestamp < now - this.cacheTTL) {
        this.cache.delete(key);
      }
    }
  },

  // 获取memos数据，支持分页
  async fetchMemos(c, tag = '', page = 1) {
    try {
      const limit = c.env.PAGE_LIMIT || CONFIG.API.PAGE_LIMIT;
      const offset = (page - 1) * limit;
      const cacheKey = `memos_${tag}_${limit}_${offset}`;
      
      // 检查缓存
      const cachedData = this.cache.get(cacheKey);
      if (cachedData && cachedData.timestamp > Date.now() - this.cacheTTL) {
        return cachedData.data;
      }
      
      // 构建API URL
      const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=${offset}`;
      console.log('请求 API:', apiUrl);

      // 发送请求
      const response = await fetch(apiUrl, { 
        headers: CONFIG.API.HEADERS,
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      
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
      
      // 定期清理缓存
      if (Math.random() < 0.1) { // 10%概率触发清理
        this.cleanupCache();
      }
      
      return data;
    } catch (error) {
      console.error('获取 memos 数据失败:', error);
      
      // 如果缓存中有旧数据，即使过期也返回
      const cachedData = this.cache.get(`memos_${tag}_${c.env.PAGE_LIMIT || CONFIG.API.PAGE_LIMIT}_${(page - 1) * (c.env.PAGE_LIMIT || CONFIG.API.PAGE_LIMIT)}`);
      if (cachedData) {
        console.log('返回过期缓存数据');
        return cachedData.data;
      }
      
      throw error;
    }
  },
  
  // 获取单条memo
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
      const response = await fetch(apiUrl, { 
        headers: CONFIG.API.HEADERS,
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      
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
      
      // 如果缓存中有旧数据，即使过期也返回
      const cachedData = this.cache.get(`memo_${name}`);
      if (cachedData) {
        console.log('返回过期缓存数据');
        return cachedData.data;
      }
      
      return null;
    }
  },
  
  // 按时间降序排序memos
  sortMemosByTime(memos) {
    return [...memos].sort((a, b) => {
      const timeA = a.createTime ? new Date(a.createTime).getTime() : a.createdTs * 1000;
      const timeB = b.createTime ? new Date(b.createTime).getTime() : b.createdTs * 1000;
      return timeB - timeA; // 降序排列
    });
  },
  
  // 渲染memo列表为HTML
  renderMemosList(memos) {
    return this.sortMemosByTime(memos).map(memo => renderMemo(memo, true));
  }
};

// 路由处理 - 优化路由模块化
export const routes = {
  // robots.txt路由 - 禁止所有搜索引擎抓取
  async robots(c) {
    return new Response('User-agent: *\nDisallow: /', {
      headers: { 'Content-Type': 'text/plain' }
    });
  },
  
  // 主页路由处理
  async home(c) {
    try {
      // 获取当前页码
      const url = new URL(c.req.url);
      const pageParam = url.searchParams.get('page');
      const currentPage = pageParam ? parseInt(pageParam) : 1;
      
      // 获取指定页的数据
      const memos = await apiHandler.fetchMemos(c, '', currentPage);
      console.log('获取到 memos 数量:', memos.length);
      
      // 渲染memo列表
      const memosHtml = apiHandler.renderMemosList(memos);
      
      // 判断是否有更多数据
      const limit = c.env.PAGE_LIMIT || CONFIG.API.PAGE_LIMIT;
      const hasMore = memos.length >= limit;

      return new Response(renderBaseHtml(
        c.env.SITE_NAME, 
        memosHtml, 
        c.env.NAV_LINKS,
        c.env.SITE_NAME,
        currentPage,
        hasMore,
        true, // 这是首页
        '' // 无标签
      ), {
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'public, max-age=300' // 5分钟缓存
        }
      });
    } catch (error) {
      console.error('渲染首页失败:', error);
      return new Response(renderErrorPage(error, c), {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
        status: 500
      });
    }
  },
  
  // 分页路由处理
  async page(c) {
    try {
      // 获取页码参数
      const pageNumber = parseInt(c.req.param('number'));
      if (isNaN(pageNumber) || pageNumber < 1) {
        return new Response(renderBaseHtml(
          c.env.SITE_NAME, 
          htmlTemplates.notFoundPage(),
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ), {
          headers: { 'Content-Type': 'text/html; charset=UTF-8' },
          status: 404
        });
      }
      
      // 获取指定页的数据
      const memos = await apiHandler.fetchMemos(c, '', pageNumber);
      console.log('获取到页面 memos 数量:', memos.length);

      // 如果没有数据且不是第一页，返回404
      if (memos.length === 0 && pageNumber > 1) {
        return new Response(renderBaseHtml(
          c.env.SITE_NAME, 
          htmlTemplates.notFoundPage(),
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ), {
          headers: { 'Content-Type': 'text/html; charset=UTF-8' },
          status: 404
        });
      }

      // 渲染memo列表
      const memosHtml = apiHandler.renderMemosList(memos);
      
      // 判断是否有更多数据
      const limit = c.env.PAGE_LIMIT || CONFIG.API.PAGE_LIMIT;
      const hasMore = memos.length >= limit;

      return new Response(renderBaseHtml(
        c.env.SITE_NAME, 
        memosHtml, 
        c.env.NAV_LINKS,
        c.env.SITE_NAME,
        pageNumber,
        hasMore,
        false, // 不是首页
        '' // 无标签
      ), {
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'public, max-age=300' // 5分钟缓存
        }
      });
    } catch (error) {
      console.error('渲染分页失败:', error);
      return new Response(renderErrorPage(error, c), {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
        status: 500
      });
    }
  },
  
  // 单页路由处理
  async post(c) {
    try {
      const name = c.req.param('name');
      const data = await apiHandler.fetchMemo(c, name);
      
      // 未找到数据
      if (!data || !data.memo) {
        return new Response(renderBaseHtml(
          c.env.SITE_NAME, 
          htmlTemplates.notFoundPage(),
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ), {
          headers: { 'Content-Type': 'text/html; charset=UTF-8' },
          status: 404
        });
      }

      const memoHtml = renderMemo(data.memo, false);

      return new Response(renderBaseHtml(
        c.env.SITE_NAME, 
        memoHtml, 
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'public, max-age=1800' // 30分钟缓存
        }
      });
    } catch (error) {
      console.error('渲染文章页失败:', error);
      return new Response(renderErrorPage(error, c), {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
        status: 500
      });
    }
  },
  
  // 标签路由处理
  async tag(c) {
    try {
      // 获取标签参数
      const tagName = c.req.param('tag');
      if (!tagName) {
        return new Response(renderBaseHtml(
          c.env.SITE_NAME, 
          htmlTemplates.notFoundPage(),
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ), {
          headers: { 'Content-Type': 'text/html; charset=UTF-8' },
          status: 404
        });
      }
      
      // 获取当前页码
      const url = new URL(c.req.url);
      const pageParam = url.searchParams.get('page');
      const currentPage = pageParam ? parseInt(pageParam) : 1;
      
      // 获取指定标签的数据
      const memos = await apiHandler.fetchMemos(c, tagName, currentPage);
      console.log(`获取到标签 ${tagName} 的 memos 数量:`, memos.length);

      // 如果没有数据，返回404
      if (memos.length === 0) {
        return new Response(renderBaseHtml(
          c.env.SITE_NAME, 
          htmlTemplates.notFoundPage(),
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ), {
          headers: { 'Content-Type': 'text/html; charset=UTF-8' },
          status: 404
        });
      }

      // 渲染memo列表
      const memosHtml = apiHandler.renderMemosList(memos);
      
      // 判断是否有更多数据
      const limit = c.env.PAGE_LIMIT || CONFIG.API.PAGE_LIMIT;
      const hasMore = memos.length >= limit;

      return new Response(renderBaseHtml(
        `#${tagName} - ${c.env.SITE_NAME}`, 
        memosHtml, 
        c.env.NAV_LINKS,
        c.env.SITE_NAME,
        currentPage,
        hasMore,
        false, // 不是首页
        tagName // 标签名
      ), {
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'public, max-age=300' // 5分钟缓存
        }
      });
    } catch (error) {
      console.error('渲染标签页失败:', error);
      return new Response(renderErrorPage(error, c), {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
        status: 500
      });
    }
  },
  
  // API代理 - 用于缓存资源
  async api(c) {
    try {
      const memos = await apiHandler.fetchMemos(c);
      return new Response(JSON.stringify(memos), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=2592000' // 30天缓存
        }
      });
    } catch (error) {
      console.error('API代理失败:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  },

  // 离线页面
  offline(c) {
    return new Response(htmlTemplates.offlinePage(c.env.SITE_NAME), {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=2592000'
      }
    });
  },

  // 离线图片占位符
  offlineImage(c) {
    // 使用模板中的透明像素Base64数据
    const base64Data = htmlTemplates.offlineImage();
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }
    
    return new Response(bytes, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=2592000'
      }
    });
  }
};
