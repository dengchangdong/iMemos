import { fetchMemos } from '../api/memos.js'
import { renderMemo } from '../views/memo.js'
import { renderBaseHtml } from '../views/base.js'
import { errorPage } from '../views/error.js'
import { CONFIG } from '../config.js'

export default async function tagRoute(c) {
  try {
    const tag = c.req.param('tag');
    const memos = await fetchMemos(c, tag);
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