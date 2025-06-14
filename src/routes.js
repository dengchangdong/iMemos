import { CONFIG } from './config.js';
import { renderMemo, renderBaseHtml, htmlTemplates } from './template.js';
import { simpleMarkdown } from './markdown.js';
import { utils } from './utils.js';

// 响应工具函数
const createResponse = (html, cacheTime = 300, status = 200) => new Response(html, {
  headers: {
    'Content-Type': 'text/html;charset=UTF-8',
    'Cache-Control': `public, max-age=${cacheTime}`
  },
  status
});

// 错误处理工具函数
const renderErrorPage = (error, c) => renderBaseHtml(
  '错误',
  htmlTemplates.errorPage(error),
  c.env.NAV_LINKS,
  c.env.SITE_NAME
);

const createNotFoundResponse = (c) => createResponse(
  renderBaseHtml(
    c.env.SITE_NAME,
    htmlTemplates.notFoundPage(),
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  ),
  300,
  404
);

// API 缓存管理器
class ApiCacheManager {
  constructor(ttl = 60 * 1000) {
    this.cache = new Map();
    this.cacheTTL = ttl;
  }

  get(cacheKey) {
    const cachedData = this.cache.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - this.cacheTTL) {
      return cachedData.data;
    }
    return null;
  }

  set(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    return data;
  }
}

// API 处理器
const apiHandler = {
  cache: new ApiCacheManager(),

  async fetchMemos(c, tag = '', page = 1) {
    try {
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const offset = (page - 1) * limit;
      const cacheKey = `memos_${tag}_${limit}_${offset}`;
      
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) return cachedData;
      
      const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=${offset}`;
      const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
      
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      return this.cache.set(cacheKey, data);
    } catch (error) {
      console.error('获取 memos 数据失败:', error);
      throw error;
    }
  },
  
  async fetchMemo(c, name) {
    try {
      const cacheKey = `memo_${name}`;
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) return cachedData;
      
      const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`;
      const response = await fetch(apiUrl, { headers: CONFIG.HEADERS });
      
      if (!response.ok) return null;

      const data = await response.json();
      return this.cache.set(cacheKey, data);
    } catch (error) {
      console.error('获取单条 memo 数据失败:', error);
      return null;
    }
  }
};

// 路由处理器
export const routes = {
  async robots(c) {
    return new Response('User-agent: *\nDisallow: /', {
      headers: { 'Content-Type': 'text/plain' }
    });
  },
  
  async home(c) {
    try {
      const url = new URL(c.req.url);
      const currentPage = parseInt(url.searchParams.get('page')) || 1;
      
      const memos = await apiHandler.fetchMemos(c, '', currentPage);
      const sortedMemos = utils.sortMemosByTime(memos);
      const memosHtml = sortedMemos.map(memo => renderMemo(memo, true));
      
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const hasMore = memos.length >= limit;

      return createResponse(renderBaseHtml(
        c.env.SITE_NAME,
        memosHtml,
        c.env.NAV_LINKS,
        c.env.SITE_NAME,
        currentPage,
        hasMore,
        true,
        ''
      ));
    } catch (error) {
      console.error('渲染首页失败:', error);
      return createResponse(renderErrorPage(error, c), 300, 500);
    }
  },
  
  async page(c) {
    try {
      const pageNumber = parseInt(c.req.param('number'));
      if (isNaN(pageNumber) || pageNumber < 1) {
        return createNotFoundResponse(c);
      }
      
      const memos = await apiHandler.fetchMemos(c, '', pageNumber);
      if (memos.length === 0 && pageNumber > 1) {
        return createNotFoundResponse(c);
      }

      const sortedMemos = utils.sortMemosByTime(memos);
      const memosHtml = sortedMemos.map(memo => renderMemo(memo, true));
      
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const hasMore = memos.length >= limit;

      return createResponse(renderBaseHtml(
        `第 ${pageNumber} 页 - ${c.env.SITE_NAME}`,
        memosHtml,
        c.env.NAV_LINKS,
        c.env.SITE_NAME,
        pageNumber,
        hasMore,
        true,
        ''
      ));
    } catch (error) {
      console.error('渲染分页失败:', error);
      return createResponse(renderErrorPage(error, c), 300, 500);
    }
  },
  
  async post(c) {
    try {
      const name = c.req.param('name');
      const data = await apiHandler.fetchMemo(c, name);
      
      if (!data?.memo) {
        return createNotFoundResponse(c);
      }

      return createResponse(renderBaseHtml(
        c.env.SITE_NAME,
        renderMemo(data.memo, false),
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), 1800);
    } catch (error) {
      console.error('渲染文章页失败:', error);
      return createResponse(renderErrorPage(error, c), 300, 500);
    }
  },
  
  async tag(c) {
    try {
      const tag = c.req.param('tag');
      const url = new URL(c.req.url);
      const currentPage = parseInt(url.searchParams.get('page')) || 1;
      
      const memos = await apiHandler.fetchMemos(c, tag, currentPage);
      const sortedMemos = utils.sortMemosByTime(memos);
      const memosHtml = sortedMemos.map(memo => renderMemo(memo, true));
      
      const limit = c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT;
      const hasMore = memos.length >= limit;

      return createResponse(renderBaseHtml(
        `标签: ${tag} - ${c.env.SITE_NAME}`,
        memosHtml,
        c.env.NAV_LINKS,
        c.env.SITE_NAME,
        currentPage,
        hasMore,
        false,
        tag
      ));
    } catch (error) {
      console.error('渲染标签页失败:', error);
      return createResponse(renderErrorPage(error, c), 300, 500);
    }
  },

  async api(c) {
    try {
      const memos = await apiHandler.fetchMemos(c);
      return c.json(memos);
    } catch (error) {
      console.error('API 请求失败:', error);
      return c.json({ error: '获取数据失败' }, 500);
    }
  },

  offline(c) {
    return createResponse(htmlTemplates.offlinePage());
  },

  offlineImage(c) {
    return new Response(htmlTemplates.offlineImage(), {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
};