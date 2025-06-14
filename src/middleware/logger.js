/**
 * 请求日志中间件
 * @param {import('hono').Context} c - Hono上下文
 * @param {Function} next - 下一个中间件函数
 */
export const logger = async (c, next) => {
  const start = Date.now();
  const { method, url } = c.req;
  
  try {
    await next();
  } finally {
    const duration = Date.now() - start;
    const status = c.res.status;
    
    console.log({
      timestamp: new Date().toISOString(),
      method,
      url,
      status,
      duration: `${duration}ms`
    });
  }
}; 