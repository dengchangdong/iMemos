import { fetchMemos } from '../api/memos.js'

export default async function apiRoute(c) {
  try {
    const memos = await fetchMemos(c);
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