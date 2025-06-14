import { Hono } from 'hono'
import { serveStatic } from 'hono/serve-static'
import { CONFIG } from './config.js'
import { routes } from './routes.js'
import { minify } from 'html-minifier'
import { minify as terserMinify } from 'terser'

/**
 * 创建Hono应用实例
 * @type {Hono}
 */
const app = new Hono()

/**
 * 注册路由
 */
app.get('/', routes.home)
app.get('/page/:number', routes.page)
app.get('/post/:name', routes.post)
app.get('/tag/:tag', routes.tag)
app.get('/robots.txt', routes.robots)
app.get('/api', routes.api)

/**
 * 静态资源处理
 */
app.use('/*', serveStatic({ root: './' }))

/**
 * 压缩HTML和JS
 * @param {string} html - 原始HTML
 * @returns {string} 压缩后的HTML
 */
async function compressHtml(html) {
  const minifiedHtml = minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyJS: true,
    minifyCSS: true,
    preserveLineBreaks: true,
    ignoreCustomComments: [/<pre>/, /<\/pre>/]
  });
  return minifiedHtml;
}

/**
 * 压缩JS
 * @param {string} js - 原始JS
 * @returns {string} 压缩后的JS
 */
async function compressJs(js) {
  const result = await terserMinify(js, {
    compress: true,
    mangle: true,
    output: {
      comments: false
    }
  });
  return result.code;
}

/**
 * 导出应用实例
 */
export default app