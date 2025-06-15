import { minify as minifyHtml } from 'html-minifier-terser';
import { minify as minifyJs } from 'terser';
import CleanCSS from 'clean-css';

// HTML 压缩配置
const htmlMinifyOptions = {
  collapseWhitespace: true,        // 折叠空白
  removeComments: true,            // 移除注释
  removeRedundantAttributes: true, // 移除冗余属性
  removeScriptTypeAttributes: true,// 移除 script 的 type 属性
  removeStyleLinkTypeAttributes: true, // 移除 style 和 link 的 type 属性
  minifyCSS: true,                 // 压缩内联 CSS
  minifyJS: true,                  // 压缩内联 JavaScript
  minifyURLs: true,                // 压缩 URL
  processScripts: ['application/ld+json'], // 处理 JSON-LD
  quoteCharacter: '"',             // 使用双引号
  sortAttributes: true,            // 排序属性
  sortClassName: true,             // 排序类名
  useShortDoctype: true,           // 使用短文档类型
  keepClosingSlash: false,         // 移除自闭合标签的斜杠
  preserveLineBreaks: false,       // 不保留换行
  removeEmptyAttributes: true,     // 移除空属性
  removeOptionalTags: true,        // 移除可选标签
  removeTagWhitespace: true,       // 移除标签间的空白
  trimCustomFragments: true,       // 修剪自定义片段
};

// JavaScript 压缩配置
const jsMinifyOptions = {
  compress: {
    dead_code: true,              // 移除死代码
    drop_console: false,          // 保留 console
    drop_debugger: true,          // 移除 debugger
    pure_funcs: [],               // 不移除任何函数调用
    passes: 2,                    // 压缩次数
  },
  mangle: {
    toplevel: false,              // 不混淆顶级作用域
    keep_classnames: true,        // 保留类名
    keep_fnames: true,            // 保留函数名
  },
  format: {
    comments: false,              // 移除注释
    ascii_only: true,             // 使用 ASCII 字符
    beautify: false,              // 不美化
  },
  sourceMap: false,               // 不生成 source map
};

// CSS 压缩配置
const cssMinifyOptions = {
  level: 2,                       // 压缩级别
  format: 'keep-breaks',          // 保持换行格式
  inline: ['none'],               // 不内联任何资源
  rebase: false,                  // 不重写 URL
  compatibility: '*',             // 兼容所有浏览器
  keepSpecialComments: 0,         // 移除所有特殊注释
  processImport: false,           // 不处理 @import
  removeComments: true,           // 移除注释
  removeEmpty: true,              // 移除空规则
  removeRedundant: true,          // 移除冗余规则
  removeWhitespace: true,         // 移除空白
  roundingPrecision: 2,           // 数值精度
  selectorsSortingMethod: 'standard', // 选择器排序方法
  shorthandCompacting: true,      // 压缩简写属性
  sourceMap: false,               // 不生成 source map
};

// 创建 CSS 压缩器实例
const cleanCss = new CleanCSS(cssMinifyOptions);

/**
 * 压缩 HTML
 * @param {string} html - 要压缩的 HTML
 * @returns {Promise<string>} 压缩后的 HTML
 */
export async function minifyHtmlContent(html) {
  try {
    return await minifyHtml(html, htmlMinifyOptions);
  } catch (error) {
    console.error('HTML 压缩失败:', error);
    return html;
  }
}

/**
 * 压缩 JavaScript
 * @param {string} code - 要压缩的 JavaScript 代码
 * @returns {Promise<string>} 压缩后的 JavaScript 代码
 */
export async function minifyJsContent(code) {
  try {
    const result = await minifyJs(code, jsMinifyOptions);
    return result.code;
  } catch (error) {
    console.error('JavaScript 压缩失败:', error);
    return code;
  }
}

/**
 * 压缩 CSS
 * @param {string} css - 要压缩的 CSS
 * @returns {string} 压缩后的 CSS
 */
export function minifyCssContent(css) {
  try {
    const result = cleanCss.minify(css);
    return result.styles;
  } catch (error) {
    console.error('CSS 压缩失败:', error);
    return css;
  }
}

/**
 * 压缩内联样式
 * @param {string} html - 包含内联样式的 HTML
 * @returns {Promise<string>} 压缩后的 HTML
 */
export async function minifyInlineStyles(html) {
  try {
    // 提取内联样式
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let match;
    let processedHtml = html;
    
    while ((match = styleRegex.exec(html)) !== null) {
      const originalStyle = match[0];
      const cssContent = match[1];
      const minifiedCss = minifyCssContent(cssContent);
      processedHtml = processedHtml.replace(originalStyle, `<style>${minifiedCss}</style>`);
    }
    
    return processedHtml;
  } catch (error) {
    console.error('内联样式压缩失败:', error);
    return html;
  }
}

/**
 * 压缩内联脚本
 * @param {string} html - 包含内联脚本的 HTML
 * @returns {Promise<string>} 压缩后的 HTML
 */
export async function minifyInlineScripts(html) {
  try {
    // 提取内联脚本
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let processedHtml = html;
    
    while ((match = scriptRegex.exec(html)) !== null) {
      const originalScript = match[0];
      const jsContent = match[1];
      const minifiedJs = await minifyJsContent(jsContent);
      processedHtml = processedHtml.replace(originalScript, `<script>${minifiedJs}</script>`);
    }
    
    return processedHtml;
  } catch (error) {
    console.error('内联脚本压缩失败:', error);
    return html;
  }
}

/**
 * 压缩完整的 HTML 内容
 * @param {string} html - 要压缩的 HTML
 * @returns {Promise<string>} 压缩后的 HTML
 */
export async function minifyFullHtml(html) {
  try {
    // 1. 先压缩内联样式
    let processedHtml = await minifyInlineStyles(html);
    
    // 2. 再压缩内联脚本
    processedHtml = await minifyInlineScripts(processedHtml);
    
    // 3. 最后压缩整个 HTML
    return await minifyHtmlContent(processedHtml);
  } catch (error) {
    console.error('完整 HTML 压缩失败:', error);
    return html;
  }
} 