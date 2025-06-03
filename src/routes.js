/**
 * 路由模块 - 处理所有HTTP路由请求
 */

import { Hono } from 'hono';
import { cache } from 'hono/cache';
import CONFIG from './config.js';
import { renderBaseHtml, renderMemo, renderErrorPage, htmlTemplates } from './templates.js';
import { apiHandler } from './api.js';

// 创建路由实例
const routes = new Hono();

/**
 * 主页路由 - 显示memo列表
 */
routes.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page')) || 1;
    const limit = parseInt(c.env.PAGE_LIMIT) || CONFIG.PAGE_LIMIT;
    const offset = (page - 1) * limit;
    
    // 获取memos数据
    const memos = await apiHandler.fetchMemos(c.env.API_HOST, limit, offset);
    
    if (!memos || !Array.isArray(memos)) {
      throw new Error('获取数据失败');
    }
    
    // 渲染memo列表
    const memosHtml = memos.map(memo => renderMemo(memo, true)).join('');
    
    // 分页控制
    let paginationHtml = '';
    if (memos.length === limit) {
      paginationHtml = `
        <div class="flex justify-center mt-8">
          <a href="/?page=${page + 1}" class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            加载更多
            <i class="ti ti-chevron-down ml-1"></i>
          </a>
        </div>
      `;
    }
    
    // 组合内容
    const content = `${memosHtml}${paginationHtml}`;
    
    // 渲染完整页面
    return new Response(
      renderBaseHtml(
        c.env.SITE_NAME || 'Memos', 
        content,
        c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ),
      {
        headers: CONFIG.HEADERS,
      }
    );
  } catch (error) {
    console.error('主页渲染错误:', error);
    return new Response(
      renderErrorPage(error, c),
      {
        headers: CONFIG.HEADERS,
        status: 500,
      }
    );
  }
});

/**
 * 单个memo页面路由
 */
routes.get('/post/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // 获取单个memo数据
    const memo = await apiHandler.fetchMemo(c.env.API_HOST, id);
    
    if (!memo) {
      return new Response(
        renderBaseHtml(
          '未找到 - ' + (c.env.SITE_NAME || 'Memos'),
          htmlTemplates.notFoundPage(),
          c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ),
        {
          headers: CONFIG.HEADERS,
          status: 404,
        }
      );
    }
    
    // 渲染单个memo
    const content = renderMemo(memo);
    
    // 渲染完整页面
    return new Response(
      renderBaseHtml(
        `${memo.content.substring(0, 30)}... - ${c.env.SITE_NAME || 'Memos'}`,
        content,
        c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ),
      {
        headers: CONFIG.HEADERS,
      }
    );
  } catch (error) {
    console.error('单页渲染错误:', error);
    return new Response(
      renderErrorPage(error, c),
      {
        headers: CONFIG.HEADERS,
        status: 500,
      }
    );
  }
});

/**
 * 标签页路由
 */
routes.get('/tag/:tag', async (c) => {
  try {
    const tag = c.req.param('tag');
    const page = parseInt(c.req.query('page')) || 1;
    const limit = parseInt(c.env.PAGE_LIMIT) || CONFIG.PAGE_LIMIT;
    const offset = (page - 1) * limit;
    
    // 获取memos数据
    const memos = await apiHandler.fetchMemos(c.env.API_HOST, limit, offset);
    
    if (!memos || !Array.isArray(memos)) {
      throw new Error('获取数据失败');
    }
    
    // 过滤包含指定标签的memo
    const tagRegex = new RegExp(`#${tag}\s|#${tag}$`);
    const filteredMemos = memos.filter(memo => tagRegex.test(memo.content));
    
    if (filteredMemos.length === 0) {
      return new Response(
        renderBaseHtml(
          `标签: ${tag} - ${c.env.SITE_NAME || 'Memos'}`,
          `<div class="text-center py-12">
            <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">没有找到相关内容</h2>
            <p class="text-gray-500 dark:text-gray-400 mb-6">暂无与标签 "${tag}" 相关的内容</p>
            <a href="/" class="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              <i class="ti ti-arrow-left mr-1"></i>
              返回首页
            </a>
          </div>`,
          c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ),
        {
          headers: CONFIG.HEADERS,
        }
      );
    }
    
    // 渲染memo列表
    const memosHtml = filteredMemos.map(memo => renderMemo(memo, true)).join('');
    
    // 分页控制
    let paginationHtml = '';
    if (filteredMemos.length === limit) {
      paginationHtml = `
        <div class="flex justify-center mt-8">
          <a href="/tag/${tag}?page=${page + 1}" class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            加载更多
            <i class="ti ti-chevron-down ml-1"></i>
          </a>
        </div>
      `;
    }
    
    // 组合内容
    const content = `
      <div class="mb-8">
        <h1 class="text-xl font-semibold mb-2">标签: ${tag}</h1>
        <p class="text-gray-500 dark:text-gray-400">共找到 ${filteredMemos.length} 条相关内容</p>
      </div>
      ${memosHtml}
      ${paginationHtml}
    `;
    
    // 渲染完整页面
    return new Response(
      renderBaseHtml(
        `标签: ${tag} - ${c.env.SITE_NAME || 'Memos'}`,
        content,
        c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ),
      {
        headers: CONFIG.HEADERS,
      }
    );
  } catch (error) {
    console.error('标签页渲染错误:', error);
    return new Response(
      renderErrorPage(error, c),
      {
        headers: CONFIG.HEADERS,
        status: 500,
      }
    );
  }
});

/**
 * API代理路由
 */
routes.get('/api/*', cache({
  cacheName: 'memos-api',
  cacheControl: 'max-age=60',
}), async (c) => {
  try {
    const path = c.req.path.replace('/api/', '');
    const url = new URL(path, c.env.API_HOST).toString();
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Memos-Themes/1.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('API代理错误:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * 离线页面路由
 */
routes.get('/offline.html', (c) => {
  return new Response(
    htmlTemplates.offlinePage(c.env.SITE_NAME),
    {
      headers: CONFIG.HEADERS,
    }
  );
});

/**
 * 离线图片占位符路由
 */
routes.get('/offline-image.png', () => {
  // 简单的1x1像素透明PNG
  const TRANSPARENT_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const binaryData = atob(TRANSPARENT_PNG);
  const bytes = new Uint8Array(binaryData.length);
  for (let i = 0; i < binaryData.length; i++) {
    bytes[i] = binaryData.charCodeAt(i);
  }
  
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000',
    },
  });
});

export default routes;