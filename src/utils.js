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
    if (minutes < 1) return '刚刚'
    
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
  
  // 压缩HTML代码
  minifyHtml(html) {
    if (!html) return '';
    
    return html
      // 删除HTML注释
      .replace(/<!--(?![\s\S]*?sortable)[\s\S]*?-->/g, '')
      // 删除CSS/JS注释
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // 压缩CSS (简单压缩)
      .replace(/([^0-9a-zA-Z\.#])\s+\{/g, '$1{')
      .replace(/\;\s*\}/g, '}')
      .replace(/\s*\:\s*/g, ':')
      .replace(/\s*\;\s*/g, ';')
      // 压缩JS (简单压缩)
      .replace(/([,;{}()])\s+/g, '$1')
      .replace(/\s+([,;{}()])/g, '$1')
      // 合并多个空格
      .replace(/\s{2,}/g, ' ')
      // 合并多个空行
      .replace(/\n{2,}/g, '\n')
      // 删除行首尾空格
      .replace(/^\s+|\s+$/gm, '')
      // 删除标签间的空白(保留内联元素内的单个空格)
      .replace(/>\s{2,}</g, '> <')
      // 安全压缩 - 保留script和pre内容不变
      .replace(/(<(pre|script|style|textarea)[^>]*>)([\s\S]*?)(<\/\2>)/gi, (match, start, tag, content, end) => {
        // 保留pre和script标签内的内容不压缩
        return start + content + end;
      });
  }
}; 