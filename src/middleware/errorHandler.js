/**
 * 全局错误处理中间件
 * @param {import('hono').Context} c - Hono上下文
 * @param {Function} next - 下一个中间件函数
 */
export const errorHandler = async (c, next) => {
  try {
    await next();
  } catch (error) {
    // 记录错误详情
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      path: c.req.path,
      method: c.req.method
    });

    // 根据错误类型返回不同的错误响应
    if (error.status === 404) {
      return c.text('页面未找到', 404);
    }

    if (error.status === 403) {
      return c.text('访问被拒绝', 403);
    }

    // 默认返回500错误
    return c.text('服务器内部错误', 500);
  }
}; 