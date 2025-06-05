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
    c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
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

  // 获取memos数据
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
};

// 路由处理 - 优化路由模块化
export const routes = {
  // 主页路由处理
  async home(c) {
    try {
      const memos = await apiHandler.fetchMemos(c);
      console.log('获取到 memos 数量:', memos.length);

      const memosHtml = memos.map(memo => renderMemo(memo, true)).join('');

      return new Response(renderBaseHtml(
        c.env.SITE_NAME, 
        memosHtml, 
        c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=300' // 5分钟缓存
        }
      });
    } catch (error) {
      console.error('渲染首页失败:', error);
      return new Response(renderErrorPage(error, c), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
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
          c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' },
          status: 404
        });
      }

      const memoHtml = renderMemo(data.memo, false);

      return new Response(renderBaseHtml(
        c.env.SITE_NAME, 
        memoHtml, 
        c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=1800' // 30分钟缓存
        }
      });
    } catch (error) {
      console.error('渲染文章页失败:', error);
      return new Response(renderErrorPage(error, c), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        status: 500
      });
    }
  },
  
  // 标签页路由处理
  async tag(c) {
    try {
      const tag = c.req.param('tag');
      const memos = await apiHandler.fetchMemos(c, tag);
      console.log('获取到标签页 memos 数量:', memos.length);

      const memosHtml = memos.map(memo => renderMemo(memo, true)).join('');

      return new Response(renderBaseHtml(
        `${tag} - ${c.env.SITE_NAME}`, 
        memosHtml, 
        c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=300' // 5分钟缓存
        }
      });
    } catch (error) {
      console.error('渲染标签页失败:', error);
      return new Response(renderErrorPage(error, c), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
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
    return new Response(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>离线 - ${c.env.SITE_NAME || '博客'}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
            color: #333;
            background-color: #f9fafb;
          }
          .container {
            max-width: 500px;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 16px;
            color: #1f2937;
          }
          p {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
            color: #4b5563;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 24px;
            color: #6b7280;
          }
          .btn {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #2563eb;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #111827;
              color: #e5e7eb;
            }
            h1 {
              color: #f9fafb;
            }
            p {
              color: #d1d5db;
            }
            .icon {
              color: #9ca3af;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📶</div>
          <h1>您当前处于离线状态</h1>
          <p>无法加载新内容。请检查您的网络连接并重试。</p>
          <a href="/" class="btn">刷新页面</a>
        </div>
      </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=2592000'
      }
    });
  },

  // 离线图片占位符
  offlineImage(c) {
    // 提供简单的Base64编码的1x1像素透明PNG作为占位符
    const transparentPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    return new Response(Buffer.from(transparentPixel, 'base64'), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=2592000'
      }
    });
  }
}; 