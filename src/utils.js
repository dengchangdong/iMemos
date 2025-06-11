// 帮助函数 - 工具集
export const utils = {
  // HTML转义，防止XSS攻击
  escapeHtml(text) {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => escapeMap[char]);
  },
  
  // 格式化时间 - 使用更简洁的条件判断
  formatTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const sameDay = date.getDate() === now.getDate();
    const sameYear = date.getFullYear() === now.getFullYear();
    
    // 使用简化的条件判断
    if (minutes < 5) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24 && sameDay) return `${hours} 小时前`;
    
    // 使用统一的日期格式化选项
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    if (sameYear) {
      options.month = '2-digit';
      options.day = '2-digit';
    } else {
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
    }
    
    return date.toLocaleString('zh-CN', options).replace(/\//g, '-');
  },
  
  // 创建HTML元素（用于模板）
  createHtml(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  }
}; 