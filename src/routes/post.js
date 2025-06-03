import { fetchMemo } from '../api/memos.js'
import { renderMemo } from '../views/memo.js'
import { renderBaseHtml } from '../views/base.js'
import { notFoundPage, errorPage } from '../views/error.js'
import { CONFIG } from '../config.js'

export default async function postRoute(c) {
  try {
    const name = c.req.param('name');
    const data = await fetchMemo(c, name);
    if (!data || !data.memo) {
      return new Response(renderBaseHtml(
        c.env.SITE_NAME,
        notFoundPage(),
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
    return new Response(renderBaseHtml(
      '错误',
      errorPage(error),
      c.env.FOOTER_TEXT || CONFIG.FOOTER_TEXT,
      c.env.NAV_LINKS,
      c.env.SITE_NAME
    ), {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      status: 500
    });
  }
} 