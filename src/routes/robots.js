/**
 * robots.txt路由处理器
 * @param {import('hono').Context} c - Hono上下文
 */
export const robots = (c) => {
  return new Response('User-agent: *\nDisallow: /', {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}; 