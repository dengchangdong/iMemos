import { fetchMemos } from '../api/memos.js'
import { renderMemo } from '../views/memo.js'
import { renderBaseHtml } from '../views/base.js'
import { CONFIG } from '../config.js'

export default async function homeRoute(c) {
  try {
    const memos = await fetchMemos(c);
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
    return new Response('服务器错误', { status: 500 });
  }
} 