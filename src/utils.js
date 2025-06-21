/**
 * 帮助函数 - 工具集
 */
export const utils = {
  /**
   * HTML转义，防止XSS攻击
   * @param {string} text - 需要转义的文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },
  
  /**
   * 格式化时间
   * @param {number} timestamp - 时间戳
   * @returns {string} 格式化后的时间字符串
   */
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
  
  /**
   * 创建HTML元素（用于模板）
   * @param {TemplateStringsArray} strings - 模板字符串数组
   * @param {...any} values - 插入值
   * @returns {string} 生成的HTML字符串
   */
  createHtml(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  },

  /**
   * 按时间降序排序memos
   * @param {Array<Object>} memos - memo对象数组
   * @returns {Array<Object>} 排序后的memo数组
   */
  sortMemosByTime(memos) {
    if (!Array.isArray(memos)) return [];
    
    return [...memos].sort((a, b) => {
      const timeA = a.createTime ? new Date(a.createTime).getTime() : a.createdTs * 1000;
      const timeB = b.createTime ? new Date(b.createTime).getTime() : b.createdTs * 1000;
      return timeB - timeA; // 降序排列
    });
  },
  
  /**
   * 压缩HTML以减少传输大小 - 专为Cloudflare Workers优化
   * @param {string} html - 原始HTML
   * @returns {string} 压缩后的HTML
   */
  minifyHtml(html) {
    if (!html || typeof html !== 'string') return '';
    
    return html
      // 移除HTML注释 (但保留条件注释和SSI指令)
      .replace(/<!--(?![\[<]|>)(?:(?!-->)[\s\S])*-->/g, '')
      // 压缩空格
      .replace(/\s{2,}/g, ' ')
      // 移除换行符
      .replace(/\n/g, '')
      // 移除不必要的空格
      .replace(/>\s+</g, '><')
      // 移除标签之间的空格
      .replace(/\s+>/g, '>')
      .replace(/<\s+/g, '<')
      // 保留脚本和样式内容
      .replace(/<(script|style)([^>]*)>([\s\S]*?)<\/\1>/gi, (match) => match);
  }
}; 