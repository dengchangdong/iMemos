import { minify } from 'html-minifier';
import { minify as terserMinify } from 'terser';

// 帮助函数 - 工具集
export const utils = {
  // HTML转义，防止XSS攻击
  escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },
  
  // 格式化时间
  formatTime(timestamp) {
    const now = new Date()
    const date = new Date(timestamp)
    const diff = now - date
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    // 1分钟以内
    if (minutes < 5) return '刚刚'
    
    // 1小时以内
    if (minutes < 60) return `${minutes} 分钟前`
    
    // 当天发布的且24小时以内
    if (hours < 24 && date.getDate() === now.getDate()) 
      return `${hours} 小时前`
    
    // 非当天发布但是是当年发布的
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\//g, '-')
    }
    
    // 非当年发布的
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  },
  
  // 创建HTML元素（用于模板）
  createHtml(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  },

  // 按时间降序排序memos
  sortMemosByTime(memos) {
    if (!Array.isArray(memos)) return [];
    
    return [...memos].sort((a, b) => {
      const timeA = a.createTime ? new Date(a.createTime).getTime() : a.createdTs * 1000;
      const timeB = b.createTime ? new Date(b.createTime).getTime() : b.createdTs * 1000;
      return timeB - timeA; // 降序排列
    });
  }
};

// 压缩 HTML 代码
export const minifyHtml = (html) => {
  return minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    minifyCSS: true,
    minifyJS: true,
    minifyURLs: true,
    useShortDoctype: true,
    removeEmptyAttributes: true,
    removeOptionalTags: true,
    removeTagWhitespace: true,
    removeAttributeQuotes: true,
    processScripts: ['application/ld+json']
  });
};

// 压缩 JavaScript 代码
export const minifyJs = async (code) => {
  try {
    const result = await terserMinify(code, {
      compress: {
        dead_code: true,
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2
      },
      mangle: true,
      format: {
        comments: false
      }
    });
    return result.code;
  } catch (error) {
    console.error('JavaScript 压缩失败:', error);
    return code;
  }
};

// 压缩内联 CSS
export const minifyCss = (css) => {
  return css
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // 移除注释
    .replace(/\s+/g, ' ') // 合并空白
    .replace(/\s*({|}|\(|\)|:|;|,)\s*/g, '$1') // 移除选择器和属性周围的空白
    .replace(/;}/g, '}') // 移除最后一个分号
    .trim();
};

// 压缩内联脚本
export const minifyInlineScript = async (html) => {
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let result = html;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    const fullScript = match[0];
    const scriptContent = match[1];
    
    // 跳过外部脚本
    if (fullScript.includes('src=')) continue;
    
    try {
      const minifiedScript = await minifyJs(scriptContent);
      result = result.replace(scriptContent, minifiedScript);
    } catch (error) {
      console.error('内联脚本压缩失败:', error);
    }
  }
  
  return result;
};

// 压缩内联样式
export const minifyInlineStyle = (html) => {
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  let result = html;
  
  while ((match = styleRegex.exec(html)) !== null) {
    const fullStyle = match[0];
    const styleContent = match[1];
    
    try {
      const minifiedStyle = minifyCss(styleContent);
      result = result.replace(styleContent, minifiedStyle);
    } catch (error) {
      console.error('内联样式压缩失败:', error);
    }
  }
  
  return result;
};

// 完整压缩流程
export const compressHtml = async (html) => {
  try {
    // 1. 压缩内联 JavaScript
    let compressed = await minifyInlineScript(html);
    
    // 2. 压缩内联 CSS
    compressed = minifyInlineStyle(compressed);
    
    // 3. 压缩整个 HTML
    compressed = minifyHtml(compressed);
    
    return compressed;
  } catch (error) {
    console.error('HTML 压缩失败:', error);
    return html;
  }
}; 