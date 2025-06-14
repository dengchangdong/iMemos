import { CONFIG } from './config.js';
import { renderMemo, renderBaseHtml, htmlTemplates } from './template.js';
import { simpleMarkdown } from './markdown.js';
import { utils, compressHtml } from './utils.js';

// 统一路由错误处理
export function renderErrorPage(error, c) {
  return renderBaseHtml(
    '错误', 
    htmlTemplates.errorPage(error),
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  );
}

// 创建统一的404响应
function createNotFoundResponse(c) {
  const notFoundHtml = renderBaseHtml(
    c.env.SITE_NAME, 
    htmlTemplates.notFoundPage(),
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  );
  return createResponse(notFoundHtml, 300, 404);
}

// 创建统一的响应处理函数
async function createResponse(html, cacheTime = 300, status = 200) {
  try {
    // 压缩 HTML
    const compressedHtml = await compressHtml(html);
    
    return new Response(compressedHtml, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': `public, max-age=${cacheTime}`,
        'Content-Encoding': 'gzip'
      },
      status
    });
  } catch (error) {
    console.error('响应压缩失败:', error);
    // 如果压缩失败，返回原始 HTML
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': `public, max-age=${cacheTime}`
      },
      status
    });
  }
}

// API处理相关 - 优化HTTP请求和缓存
export const apiHandler = {
  // 数据缓存
  cache: new Map(),
  
  // 缓存TTL，默认1分钟（单位：毫秒）
  cacheTTL: 60 * 1000,

  // 通用缓存检查函数
  checkCache(cacheKey) {
    const cachedData = this.cache.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - this.cacheTTL) {
      return cachedData.data;
    }
    return null;
  },
  
  // 通用缓存更新函数
  updateCache(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    return data;
  },

  // 获取memos数据，支持分页
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
  },
  
  // 获取单条memo
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
      return createResponse(renderErrorPage(error, c), 300, 500);
    }
  },
  
  // 分页路由处理
  async page(c) {
    try {
      // 获取页码参数
      const pageNumber = parseInt(c.req.param('number'));
      if (isNaN(pageNumber) || pageNumber < 1) {
        return createNotFoundResponse(c);
      }
      
      // 获取指定页的数据
      const memos = await apiHandler.fetchMemos(c, '', pageNumber);
      console.log('获取到页面 memos 数量:', memos.length);

      // 如果没有数据且不是第一页，返回404
      if (memos.length === 0 && pageNumber > 1) {
        return createNotFoundResponse(c);
      }

      // 按时间降序排序memos
      const sortedMemos = utils.sortMemosByTime(memos);
      const memosHtml = sortedMemos.map(memo => renderMemo(memo, true));
      
      // 判断是否有更多数据
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const hasMore = memos.length >= limit;

      const html = renderBaseHtml(
        `第 ${pageNumber} 页 - ${c.env.SITE_NAME}`,
        memosHtml,
        c.env.NAV_LINKS,
        c.env.SITE_NAME,
        pageNumber,
        hasMore,
        true, // 这是分页列表
        '' // 无标签
      );
      
      return createResponse(html);
    } catch (error) {
      console.error('渲染分页失败:', error);
      return createResponse(renderErrorPage(error, c), 300, 500);
    }
  },
  
  // 单页路由处理
  async post(c) {
    try {
      const name = c.req.param('name');
      const data = await apiHandler.fetchMemo(c, name);
      
      // 未找到数据
      if (!data || !data.memo) {
        return createNotFoundResponse(c);
      }

      const memoHtml = renderMemo(data.memo, false);
      const html = renderBaseHtml(
        c.env.SITE_NAME, 
        memoHtml, 
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      );
      
      return createResponse(html, 1800); // 30分钟缓存
    } catch (error) {
      console.error('渲染文章页失败:', error);
      return createResponse(renderErrorPage(error, c), 300, 500);
    }
  },
  
  // 标签页路由处理
  async tag(c) {
    try {
      const tag = c.req.param('tag');
      
      // 获取当前页码
      const url = new URL(c.req.url);
      const pageParam = url.searchParams.get('page');
      const currentPage = pageParam ? parseInt(pageParam) : 1;
      
      const memos = await apiHandler.fetchMemos(c, tag, currentPage);
      console.log('获取到标签页 memos 数量:', memos.length);

      // 按时间降序排序memos
      const sortedMemos = utils.sortMemosByTime(memos);
      const memosHtml = sortedMemos.map(memo => renderMemo(memo, true));
      
      // 判断是否有更多数据
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const hasMore = memos.length >= limit;

      const html = renderBaseHtml(
        `${tag} - ${c.env.SITE_NAME}`, 
        memosHtml, 
        c.env.NAV_LINKS,
        c.env.SITE_NAME,
        currentPage,
        hasMore,
        true, // 这是分类页，也需要分页
        tag // 传递标签参数
      );
      
      return createResponse(html);
    } catch (error) {
      console.error('渲染标签页失败:', error);
      return createResponse(renderErrorPage(error, c), 300, 500);
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
  }
};