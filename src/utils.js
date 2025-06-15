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

// HTML压缩工具
export const minifier = {
  // 压缩HTML
  minifyHtml(html) {
    return html
      // 移除HTML注释
      .replace(/<!--[\s\S]*?-->/g, '')
      // 移除多余空白
      .replace(/>\s+</g, '><')
      .replace(/\s+/g, ' ')
      // 移除标签内的多余空白
      .replace(/\s+>/g, '>')
      .replace(/<\s+/g, '<')
      // 保留必要的空白（pre, textarea, code等标签内）
      .replace(/(<pre[^>]*>|<\/pre>|<textarea[^>]*>|<\/textarea>|<code[^>]*>|<\/code>)/g, match => {
        return match.replace(/\s+/g, ' ');
      });
  },

  // 压缩CSS
  minifyCss(css) {
    return css
      // 移除CSS注释
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // 移除多余空白
      .replace(/\s+/g, ' ')
      // 移除选择器中的多余空白
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*:\s*/g, ':')
      .replace(/\s*;\s*/g, ';')
      .replace(/\s*,\s*/g, ',')
      // 移除最后一个分号
      .replace(/;}/g, '}')
      // 移除零值单位
      .replace(/(\s|:)0(px|em|rem|%|vh|vw|vmin|vmax)/g, '$10')
      // 移除颜色值中的零
      .replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3')
      // 移除小数点前的零
      .replace(/(\s|:)\./g, '$10.');
  },

  // 压缩JavaScript
  minifyJs(js) {
    // 移除单行注释
    js = js.replace(/\/\/.*/g, '');
    
    // 移除多行注释
    js = js.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // 移除多余空白
    js = js.replace(/\s+/g, ' ');
    
    // 移除分号后的空白
    js = js.replace(/;\s+/g, ';');
    
    // 移除括号内的空白
    js = js.replace(/\(\s+/g, '(');
    js = js.replace(/\s+\)/g, ')');
    
    // 移除大括号内的空白
    js = js.replace(/{\s+/g, '{');
    js = js.replace(/\s+}/g, '}');
    
    // 移除逗号后的空白
    js = js.replace(/,\s+/g, ',');
    
    // 移除运算符周围的空白
    js = js.replace(/\s*([+\-*/=<>!&|^~?:])\s*/g, '$1');
    
    // 保护字符串内容
    const strings = [];
    js = js.replace(/(['"])((?:\\\1|.)*?)\1/g, (match) => {
      strings.push(match);
      return `__STRING${strings.length - 1}__`;
    });
    
    // 执行压缩
    js = js.trim();
    
    // 恢复字符串内容
    js = js.replace(/__STRING(\d+)__/g, (_, index) => strings[index]);
    
    return js;
  },

  // 智能压缩 - 根据内容类型自动选择压缩方法
  smartMinify(content, type = 'html') {
    try {
      switch (type) {
        case 'css':
          return this.minifyCss(content);
        case 'js':
          return this.minifyJs(content);
        case 'html':
        default:
          return this.minifyHtml(content);
      }
    } catch (error) {
      console.error('压缩失败:', error);
      return content; // 如果压缩失败，返回原始内容
    }
  }
}; 