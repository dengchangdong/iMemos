import { CONFIG } from './config.js';
import { renderMemo, renderBaseHtml, htmlTemplates } from './template.js';
import { simpleMarkdown } from './markdown.js'; // Unused in this snippet, but kept for completeness
import { utils } from './utils.js';

/**
 * 创建统一的HTTP响应。
 * @param {string} html - 响应的HTML内容。
 * @param {number} [cacheTime=300] - 缓存时间（秒）。
 * @param {number} [status=200] - HTTP状态码。
 * @returns {Response}
 */
function createHtmlResponse(html, cacheTime = 300, status = 200) {
  // 压缩配置
  const compressionConfig = {
    enabled: true,      // 是否启用压缩
    minifyHtml: true,   // 是否压缩HTML
    minifyJs: true,     // 是否压缩JS
    minifyCss: true,    // 是否压缩CSS
    debug: false,       // 是否在控制台输出压缩统计
  };
  
  // 应用压缩以提高在Cloudflare Workers上的性能
  let minifiedHtml = html;
  let compressionStats = { originalSize: html.length };
  
  if (compressionConfig.enabled) {
    try {
      // 使用新的统一压缩函数
      minifiedHtml = utils.minify(html, 'html', compressionConfig);
      
      // 简单验证压缩后的HTML是否包含必要的结构
      if (!minifiedHtml.includes('<html') || !minifiedHtml.includes('<body') || !minifiedHtml.includes('</body>')) {
        console.error('HTML压缩可能导致损坏，使用原始HTML');
        minifiedHtml = html;
      }
      
      // 计算压缩统计
      compressionStats.minifiedSize = minifiedHtml.length;
      compressionStats.savedBytes = html.length - minifiedHtml.length;
      compressionStats.savedPercentage = ((html.length - minifiedHtml.length) / html.length * 100).toFixed(2);
      
      if (compressionConfig.debug) {
        console.log(
          `压缩统计 - 原始: ${compressionStats.originalSize} 字节, ` +
          `压缩后: ${compressionStats.minifiedSize} 字节, ` +
          `节省: ${compressionStats.savedBytes} 字节 (${compressionStats.savedPercentage}%)`
        );
      }
    } catch (error) {
      console.error('内容压缩失败，使用原始HTML:', error);
      minifiedHtml = html;
    }
  }
  
  const headers = {
    'Content-Type': 'text/html;charset=UTF-8',
    'Cache-Control': `public, max-age=${cacheTime}`,
    'Content-Length': minifiedHtml.length.toString(),
    'Server': 'Cloudflare Workers'
  };
  
  // 在生产环境中，可以添加更多性能相关的头
  if (process.env.NODE_ENV === 'production') {
    headers['X-Content-Type-Options'] = 'nosniff';
  }
  
  return new Response(minifiedHtml, { headers, status });
}

/**
 * 统一路由错误处理并生成响应。
 * @param {Error} error - 错误对象。
 * @param {object} c - Hono上下文对象。
 * @param {number} [status=500] - HTTP状态码。
 * @param {number} [cacheTime=300] - 缓存时间（秒）。
 * @returns {Response}
 */
export function handleRouteError(error, c, status = 500, cacheTime = 300) {
  console.error('路由处理失败:', error);
  const errorPageHtml = renderBaseHtml(
    '错误',
    htmlTemplates.errorPage(error),
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  );
  return createHtmlResponse(errorPageHtml, cacheTime, status);
}

/**
 * 创建统一的404未找到响应。
 * @param {object} c - Hono上下文对象。
 * @returns {Response}
 */
function createNotFoundResponse(c) {
  return handleRouteError(new Error('页面未找到'), c, 404, 300);
}

// --- API处理相关：优化HTTP请求和缓存 ---
export const apiHandler = {
  /** @type {Map<string, {data: any, timestamp: number}>} 缓存存储 */
  cache: new Map(),
  /** @type {number} 缓存过期时间（毫秒） */
  cacheTTL: 60 * 1000, // 默认1分钟

  /**
   * 通用缓存检查函数。
   * @param {string} cacheKey
   * @returns {any|null} 缓存数据或null。
   */
  checkCache(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && cached.timestamp > Date.now() - this.cacheTTL) {
      return cached.data;
    }
    return null;
  },

  /**
   * 通用缓存更新函数。
   * @param {string} cacheKey
   * @param {any} data
   * @returns {any} 缓存的数据。
   */
  updateCache(cacheKey, data) {
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  },

  /**
   * 内部通用API请求器。
   * @param {string} url - API URL。
   * @param {string} cacheKey - 缓存键。
   * @returns {Promise<any>}
   */
  async _fetchAndCache(url, cacheKey) {
    const cachedData = this.checkCache(cacheKey);
    if (cachedData) return cachedData;

    console.log('请求 API:', url);
    const response = await fetch(url, { headers: CONFIG.HEADERS });

    if (!response.ok) {
      const errorMsg = `API 请求失败: ${response.status} - ${url}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return this.updateCache(cacheKey, data);
  },

  /**
   * 获取memos数据，支持分页和标签过滤。
   * @param {object} c - Hono上下文对象。
   * @param {string} [tag=''] - 标签。
   * @param {number} [page=1] - 页码。
   * @returns {Promise<Array<object>>}
   */
  async fetchMemos(c, tag = '', page = 1) {
    try {
      const limit = parseInt(c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT);
      const offset = (page - 1) * limit;
      const cacheKey = `memos_${tag}_${limit}_${offset}`;
      const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=${offset}`;
      return this._fetchAndCache(apiUrl, cacheKey);
    } catch (error) {
      console.error('获取 memos 数据失败:', error);
      throw error; // Re-throw to be caught by route handler
    }
  },

  /**
   * 获取单条memo数据。
   * @param {object} c - Hono上下文对象。
   * @param {string} name - memo的名称（ID）。
   * @returns {Promise<object|null>}
   */
  async fetchMemo(c, name) {
    try {
      const cacheKey = `memo_${name}`;
      const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`;
      const data = await this._fetchAndCache(apiUrl, cacheKey);
      return data;
    } catch (error) {
      // For single memo, often returning null for not found is acceptable rather than throwing
      console.error('获取单条 memo 数据失败:', error);
      return null;
    }
  }
};

/**
 * 获取每页显示的数量限制。
 * @param {object} c - Hono上下文对象。
 * @returns {number}
 */
function getPageLimit(c) {
  // 确保返回数字类型
  return parseInt(c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT);
}

/**
 * 从URL的查询参数中获取页码。
 * @param {object} c - Hono上下文对象。
 * @returns {number}
 */
function getPageFromUrlParams(c) {
  const url = new URL(c.req.url);
  const pageParam = url.searchParams.get('page');
  return pageParam ? parseInt(pageParam) : 1;
}

/**
 * 通用处理Memos列表页的路由函数。
 * @param {object} c - Hono上下文对象。
 * @param {object} options - 配置对象。
 * @param {function(object): number} options.getPage - 获取当前页码的函数。
 * @param {string} [options.tag=''] - 列表所属的标签。
 * @param {boolean} [options.isExplicitPageRoute=false] - 是否是明确的/page/:number路由，用于404判断。
 * @param {function(number, string, string): string} options.getTitle - 获取页面标题的函数。
 * @returns {Promise<Response>}
 */
async function handleMemoListRoute(c, { getPage, tag = '', isExplicitPageRoute = false, getTitle }) {
  try {
    const currentPage = getPage(c);
    if (isNaN(currentPage) || currentPage < 1) {
      return createNotFoundResponse(c);
    }

    const memos = await apiHandler.fetchMemos(c, tag, currentPage);
    console.log(`获取到 ${tag ? tag + ' 标签页' : '列表页'} memos 数量:`, memos.length);

    // 对于非第一页且无数据的明确分页路由，返回404
    if (memos.length === 0 && currentPage > 1 && isExplicitPageRoute) {
      return createNotFoundResponse(c);
    }

    const sortedMemos = utils.sortMemosByTime(memos);
    
    // 获取视图布局模式 (默认是列表)
    const url = new URL(c.req.url);
    const viewMode = url.searchParams.get('view') || 'list';
    const isBentoLayout = viewMode === 'bento' && currentPage === 1 && !tag;
    
    // 渲染memos
    const memosHtml = sortedMemos.map(memo => renderMemo(memo, true, isBentoLayout));

    const limit = getPageLimit(c);
    const hasMore = memos.length >= limit;

    const title = getTitle(currentPage, tag, c.env.SITE_NAME);

    return createHtmlResponse(
      renderBaseHtml(
        title,
        memosHtml,
        c.env.NAV_LINKS,
        c.env.SITE_NAME,
        currentPage,
        hasMore,
        true, // isHomePage
        tag,
        memos.length, // 添加memos数量
        limit, // 添加页面限制
        isBentoLayout // 添加是否使用Bento布局
      )
    );
  } catch (error) {
    return handleRouteError(error, c);
  }
}

export const routes = {
  // robots.txt路由 - 禁止所有搜索引擎抓取
  async robots(c) {
    return new Response('User-agent: *\nDisallow: /', {
      headers: { 'Content-Type': 'text/plain' }
    });
  },

  // RSS订阅路由处理
  async rss(c) {
    try {
      const limit = parseInt(c.env.PAGE_LIMIT || CONFIG.PAGE_LIMIT);
      const memos = await apiHandler.fetchMemos(c, '', 1);
      
      const sortedMemos = utils.sortMemosByTime(memos);
      
      // 获取站点基础URL
      const url = new URL(c.req.url);
      const siteUrl = `${url.protocol}//${url.host}`;
      
      // 生成RSS XML
      const rssXml = utils.generateRSSXml(sortedMemos, {
        siteUrl,
        siteName: c.env.SITE_NAME,
        siteDescription: c.env.SITE_DESCRIPTION || c.env.SITE_NAME
      });
      
      return new Response(rssXml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600' // 1小时缓存
        }
      });
    } catch (error) {
      console.error('RSS生成失败:', error);
      return new Response('RSS生成失败', { 
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  },

  // 主页路由处理
  async home(c) {
    return handleMemoListRoute(c, {
      getPage: getPageFromUrlParams,
      tag: '',
      isExplicitPageRoute: false,
      getTitle: (page, tag, siteName) => siteName, // 首页标题就是站点名称
    });
  },

  // 分页路由处理
  async page(c) {
    return handleMemoListRoute(c, {
      getPage: (ctx) => parseInt(ctx.req.param('number')),
      tag: '',
      isExplicitPageRoute: true, // 这是明确的分页路由
      getTitle: (page, tag, siteName) => `第 ${page} 页 - ${siteName}`,
    });
  },

  // 单页路由处理
  async post(c) {
    try {
      const name = c.req.param('name');
      const data = await apiHandler.fetchMemo(c, name);

      if (!data || !data.memo) {
        return createNotFoundResponse(c);
      }

      const memoHtml = renderMemo(data.memo, false);
      // 提取memo内容的前50个字符作为标题，或使用站点名称
      const postTitle = (data.memo.content?.split('\n')[0]?.substring(0, 30) + ' - ' + c.env.SITE_NAME);

      return createHtmlResponse(
        renderBaseHtml(
          postTitle,
          memoHtml,
          c.env.NAV_LINKS,
          c.env.SITE_NAME,
          1,         // currentPage
          false,     // hasMore
          false,     // isHomePage
          '',        // tag
          0,         // memosCount
          getPageLimit(c) // pageLimit
        ),
        1800 // 30分钟缓存
      );
    } catch (error) {
      return handleRouteError(error, c);
    }
  },

  // 标签页路由处理
  async tag(c) {
    const tag = c.req.param('tag');
    return handleMemoListRoute(c, {
      getPage: getPageFromUrlParams,
      tag: tag,
      isExplicitPageRoute: false,
      getTitle: (page, tag, siteName) => `${tag} - ${siteName}`,
    });
  },

  // API代理 - 用于缓存资源 (保持原有逻辑，因为是JSON响应)
  async api(c) {
    try {
      // 这里的 API 请求参数可以根据实际需求调整，例如支持 page, tag 等
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
