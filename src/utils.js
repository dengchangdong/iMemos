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
    
    // 简化时间显示逻辑
    if (minutes < 5) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24 && date.getDate() === now.getDate()) return `${hours} 小时前`
    
    // 统一日期格式化选项
    const options = {
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    }
    
    // 根据年份决定是否显示年份
    if (date.getFullYear() === now.getFullYear()) {
      options.month = '2-digit'
      options.day = '2-digit'
    } else {
      options.year = 'numeric'
      options.month = '2-digit'
      options.day = '2-digit'
    }
    
    return date.toLocaleString('zh-CN', options).replace(/\//g, '-')
  },
  
  // 创建HTML元素（用于模板）
  createHtml(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  }
}; 