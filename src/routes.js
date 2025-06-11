import { CONFIG } from './config.js';
import { renderMemo, renderBaseHtml, htmlTemplates } from './template.js';
import { simpleMarkdown } from './markdown.js';

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
  cacheTTL: 60 * 1000,

  // 通用缓存获取函数
  async fetchWithCache(cacheKey, fetchFn) {
    // 检查缓存
    const cachedData = this.cache.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - this.cacheTTL) {
      return cachedData.data;
    }
    
    // 获取新数据
    const data = await fetchFn();
    
    // 更新缓存
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
      
      return await this.fetchWithCache(cacheKey, async () => {
        // 构建API URL
        const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=${offset}`;
        console.log('请求 API:', apiUrl);

        // 发送请求
        const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
        if (!response.ok) {
          throw new Error(`API 请求失败: ${response.status}`);
        }

        // 解析数据
        return await response.json();
      });
    } catch (error) {
      console.error('获取 memos 数据失败:', error);
      throw error;
    }
  },
  
  // 获取单条memo
  async fetchMemo(c, name) {
    try {
      const cacheKey = `memo_${name}`;
      
      return await this.fetchWithCache(cacheKey, async () => {
        // 构建API URL
        const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`;
        console.log('请求 API:', apiUrl);

        // 发送请求
        const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
        if (!response.ok) {
          return null;
        }

        // 解析数据
        return await response.json();
      });
    } catch (error) {
      console.error('获取单条 memo 数据失败:', error);
      return null;
    }
  },
  
  // 按时间排序memos
  sortMemosByTime(memos) {
    return [...memos].sort((a, b) => {
      const timeA = a.createTime ? new Date(a.createTime).getTime() : a.createdTs * 1000;
      const timeB = b.createTime ? new Date(b.createTime).getTime() : b.createdTs * 1000;
      return timeB - timeA; // 降序排列
    });
  }
};

// 通用响应生成
const createResponse = (content, status = 200) => {
  return new Response(content, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=300' // 5分钟缓存
    },
    status
  });
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
      const sortedMemos = apiHandler.sortMemosByTime(memos);
      const memosHtml = sortedMemos.map(memo => renderMemo(memo, true));
      
      // 判断是否有更多数据
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const hasMore = memos.length >= limit;

      return createResponse(renderBaseHtml(
        c.env.SITE_NAME, 
        memosHtml, 
        c.env.NAV_LINKS,
        c.env.SITE_NAME,
        currentPage,
        hasMore,
        true, // 这是首页
        '' // 无标签
      ));
    } catch (error) {
      console.error('渲染首页失败:', error);
      return createResponse(renderErrorPage(error, c), 500);
    }
  },
  
  // 分页路由处理
  async page(c) {
    try {
      // 获取页码参数
      const pageNumber = parseInt(c.req.param('number'));
      if (isNaN(pageNumber) || pageNumber < 1) {
        return createResponse(renderBaseHtml(
          c.env.SITE_NAME, 
          htmlTemplates.notFoundPage(),
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ), 404);
      }
      
      // 获取指定页的数据
      const memos = await apiHandler.fetchMemos(c, '', pageNumber);
      console.log('获取到页面 memos 数量:', memos.length);

      // 如果没有数据且不是第一页，返回404
      if (memos.length === 0 && pageNumber > 1) {
        return createResponse(renderBaseHtml(
          c.env.SITE_NAME, 
          htmlTemplates.notFoundPage(),
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ), 404);
      }

      // 处理和渲染数据
      const sortedMemos = apiHandler.sortMemosByTime(memos);
      const memosHtml = sortedMemos.map(memo => renderMemo(memo));
      
      // 判断是否有更多数据
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const hasMore = memos.length >= limit;

      return createResponse(renderBaseHtml(
        c.env.SITE_NAME, 
        memosHtml, 
        c.env.NAV_LINKS,
        c.env.SITE_NAME,
        pageNumber,
        hasMore
      ));
    } catch (error) {
      console.error('渲染分页失败:', error);
      return createResponse(renderErrorPage(error, c), 500);
    }
  },
  
  // 单条memo路由处理
  async post(c) {
    try {
      const name = c.req.param('name');
      const memo = await apiHandler.fetchMemo(c, name);
      
      // 如果没有找到memo，返回404
      if (!memo) {
        return createResponse(renderBaseHtml(
          c.env.SITE_NAME, 
          htmlTemplates.notFoundPage(),
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ), 404);
      }
      
      // 渲染单条memo
      const memoHtml = renderMemo(memo);
      
      return createResponse(renderBaseHtml(
        memo.content.substring(0, 30) + '... - ' + c.env.SITE_NAME, 
        memoHtml, 
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ));
    } catch (error) {
      console.error('渲染单条memo失败:', error);
      return createResponse(renderErrorPage(error, c), 500);
    }
  },
  
  // 标签路由处理
  async tag(c) {
    try {
      const tag = c.req.param('tag');
      
      // 获取当前页码
      const url = new URL(c.req.url);
      const pageParam = url.searchParams.get('page');
      const currentPage = pageParam ? parseInt(pageParam) : 1;
      
      // 获取指定标签的数据
      const memos = await apiHandler.fetchMemos(c, tag, currentPage);
      console.log('获取到标签 memos 数量:', memos.length);

      // 如果没有数据，返回404
      if (memos.length === 0) {
        return createResponse(renderBaseHtml(
          `#${tag} - ${c.env.SITE_NAME}`, 
          `<div class="my-8 text-center text-gray-500 dark:text-gray-400">没有找到包含标签 #${tag} 的内容</div>`,
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ));
      }

      // 处理和渲染数据
      const sortedMemos = apiHandler.sortMemosByTime(memos);
      const memosHtml = sortedMemos.map(memo => renderMemo(memo));
      
      // 判断是否有更多数据
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const hasMore = memos.length >= limit;

      return createResponse(renderBaseHtml(
        `#${tag} - ${c.env.SITE_NAME}`, 
        memosHtml, 
        c.env.NAV_LINKS,
        c.env.SITE_NAME,
        currentPage,
        hasMore,
        false, // 不是首页
        tag
      ));
    } catch (error) {
      console.error('渲染标签页失败:', error);
      return createResponse(renderErrorPage(error, c), 500);
    }
  },
  
  // API路由处理
  async api(c) {
    try {
      const url = new URL(c.req.url);
      const tag = url.searchParams.get('tag') || '';
      const page = parseInt(url.searchParams.get('page') || '1');
      
      const memos = await apiHandler.fetchMemos(c, tag, page);
      const sortedMemos = apiHandler.sortMemosByTime(memos);
      
      return new Response(JSON.stringify(sortedMemos), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('API请求失败:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  },
  
  // 离线页面
  offline(c) {
    return new Response(htmlTemplates.offlinePage(c.env.SITE_NAME), {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
  },
  
  // 离线图片占位符
  offlineImage(c) {
    return new Response(htmlTemplates.offlineImage(), {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000' }
    });
  }
};