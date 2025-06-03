import apiHandler from './api.js';
import { renderMemo, htmlTemplates, renderBaseHtml } from './template.js';

const routes = {
  // 主页路由处理
  async home(c) {
    try {
      const memos = await apiHandler.fetchMemos(c);
      const memosHtml = memos.map(memo => renderMemo(memo, true)).join('');
      return new Response(renderBaseHtml(
        c.env.SITE_NAME,
        memosHtml,
        c.env.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=300'
        }
      });
    } catch (error) {
      return new Response(renderBaseHtml(
        '错误',
        htmlTemplates.errorPage(error),
        c.env.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
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
      if (!data || !data.memo) {
        return new Response(renderBaseHtml(
          c.env.SITE_NAME,
          htmlTemplates.notFoundPage(),
          c.env.FOOTER_TEXT,
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
        c.env.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=1800'
        }
      });
    } catch (error) {
      return new Response(renderBaseHtml(
        '错误',
        htmlTemplates.errorPage(error),
        c.env.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
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
      const memosHtml = memos.map(memo => renderMemo(memo, true)).join('');
      return new Response(renderBaseHtml(
        `${tag} - ${c.env.SITE_NAME}`,
        memosHtml,
        c.env.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=300'
        }
      });
    } catch (error) {
      return new Response(renderBaseHtml(
        '错误',
        htmlTemplates.errorPage(error),
        c.env.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        status: 500
      });
    }
  },
  // API代理
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
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }
};

export default routes; 