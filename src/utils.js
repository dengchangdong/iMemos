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
export const htmlCompressor = {
  // 压缩HTML字符串
  compress(html) {
    return html
      // 移除HTML注释
      .replace(/<!--[\s\S]*?-->/g, '')
      // 移除空白行
      .replace(/^\s*[\r\n]/gm, '')
      // 压缩空白字符
      .replace(/>\s+</g, '><')
      // 移除标签之间的空白
      .replace(/\s+>/g, '>')
      .replace(/<\s+/g, '<')
      // 移除属性值中的多余空白
      .replace(/\s*=\s*/g, '=')
      // 移除自闭合标签后的空白
      .replace(/\s*\/>/g, '/>')
      // 移除script和style标签内的空白（保留内容）
      .replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gi, (match, open, content, close) => {
        return open + content.replace(/\s+/g, ' ') + close;
      })
      .replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (match, open, content, close) => {
        return open + content.replace(/\s+/g, ' ') + close;
      });
  },

  // 压缩响应
  compressResponse(response) {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      return response;
    }

    return response.text().then(text => {
      const compressed = this.compress(text);
      return new Response(compressed, {
        headers: {
          'content-type': 'text/html;charset=UTF-8',
          'content-encoding': 'gzip',
          'cache-control': response.headers.get('cache-control') || 'public, max-age=300'
        }
      });
    });
  }
}; 