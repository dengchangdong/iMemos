import { Hono } from 'hono';
import { renderToString } from '@vue/server-renderer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 创建 Hono 应用
const app = new Hono();

// 错误处理中间件
app.use('*', async (c, next) => {
  try {
    await next();
  } catch (err) {
    console.error('错误:', err);
    return c.text('服务器错误', 500);
  }
});

// 读取静态 HTML 模板
let template = '';
try {
  template = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
} catch (err) {
  console.error('无法读取 HTML 模板:', err);
  template = '<!DOCTYPE html><html><head><title>Error</title></head><body>Template Error</body></html>';
}

// 处理 API 请求
app.get('/api/v1/memo', async (c) => {
  try {
    const { tag = '', page = 1 } = c.req.query();
    const limit = parseInt(c.env.PAGE_LIMIT || '10');
    const offset = (page - 1) * limit;
    
    const response = await fetch(
      `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=${offset}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('获取 memos 失败:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 处理 API 单条记录请求
app.get('/api/v1/memo/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const response = await fetch(
      `${c.env.API_HOST}/api/v2/memos/${id}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('获取单条 memo 失败:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 处理静态资源
app.get('/assets/*', async (c) => {
  // Cloudflare Workers 环境中会通过 R2 存储或边缘网络提供静态文件
  // 在实际部署时，这些文件会被 Wrangler 处理
  c.status(404);
  return c.text('Not found');
});

// 处理所有前端路由
app.get('*', async (c) => {
  try {
    // 替换模板中的环境变量
    const html = template
      .replace(/%SITE_NAME%/g, c.env.SITE_NAME || '归零杂记')
      .replace(/%API_HOST%/g, c.env.API_HOST || '')
      .replace(/%PAGE_LIMIT%/g, c.env.PAGE_LIMIT || '10')
      .replace(/%NAV_LINKS%/g, c.env.NAV_LINKS || '{}');
    
    return c.html(html);
  } catch (error) {
    console.error('渲染页面失败:', error);
    return c.text('服务器错误', 500);
  }
});

// 处理 robots.txt
app.get('/robots.txt', (c) => {
  return c.text('User-agent: *\nAllow: /');
});

export default app;