import { apiHandler } from './api'
import { renderMemo } from './memo'
import { renderBaseHtml } from './html'
import { htmlTemplates } from './templates'
import { CONFIG } from './config'

export const routes = {
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
          'Cache-Control': 'public, max-age=300'
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
  async post(c) {
    try {
      const name = c.req.param('name');
      const data = await apiHandler.fetchMemo(c, name);
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
          'Cache-Control': 'public, max-age=1800'
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
          'Cache-Control': 'public, max-age=300'
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
  async api(c) {
    try {
      const memos = await apiHandler.fetchMemos(c);
      return new Response(JSON.stringify(memos), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=2592000'
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

function renderErrorPage(error, c) {
  return renderBaseHtml(
    '错误', 
    htmlTemplates.errorPage(error),
    c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  );
} 