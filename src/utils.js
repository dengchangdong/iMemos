// 帮助函数 - 工具集
export const utils = {
  // HTML转义，防止XSS攻击
  escapeHtml(text) {
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => htmlEntities[char]);
  },
  
  // 格式化时间
  formatTime(timestamp) {
    const now = new Date()
    const date = new Date(timestamp)
    const diff = now - date
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    // 使用 Map 优化条件判断
    const timeFormats = new Map([
      [minutes < 5, '刚刚'],
      [minutes < 60, `${minutes} 分钟前`],
      [hours < 24 && date.getDate() === now.getDate(), `${hours} 小时前`]
    ]);
    
    // 查找第一个匹配的条件
    for (const [condition, format] of timeFormats) {
      if (condition) return format;
    }
    
    // 日期格式化选项
    const dateOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    // 根据年份决定是否显示年份
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleString('zh-CN', {
        ...dateOptions,
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');
    }
    
    return date.toLocaleString('zh-CN', {
      ...dateOptions,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
  },
  
  // 创建HTML元素（用于模板）
  createHtml(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  },

  // 按时间降序排序memos
  sortMemosByTime(memos) {
    if (!Array.isArray(memos)) return [];
    
    return [...memos].sort((a, b) => {
      const getTimestamp = memo => {
        if (memo.createTime) return new Date(memo.createTime).getTime();
        return memo.createdTs * 1000;
      };
      
      return getTimestamp(b) - getTimestamp(a);
    });
  }
}; 