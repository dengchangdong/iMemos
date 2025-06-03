/**
 * Memos-Themes 主入口文件
 * 整合所有模块，提供完整的应用功能
 */

import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import { logger } from 'hono/logger';
import { cache } from 'hono/cache';

// 导入自定义模块
import CONFIG from './config.js';
import routes from './routes.js';

// 创建Hono应用实例
const app = new Hono();

// 中间件配置
app.use('*', prettyJSON());
app.use('*', logger());

// 错误处理中间件
app.onError((err, c) => {
  console.error(`[错误] ${err.message}`);
  return c.text(`服务器错误: ${err.message}`, 500);
});

// 注册所有路由
app.route('/', routes);

// 导出应用
export default app;