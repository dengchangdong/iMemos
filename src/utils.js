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
    
    try {
      // 保存已知的块以避免处理它们(scripts, styles, pre, textarea等)
      const savedBlocks = [];
      let processedHtml = html;
      
      // 识别和保存特殊块
      const saveSpecialBlocks = (html, tagName) => {
        return html.replace(
          new RegExp(`<${tagName}([\\s\\S]*?)>([\\s\\S]*?)<\\/${tagName}>`, 'gi'),
          (match) => {
            savedBlocks.push(match);
            return `###SAVED_BLOCK_${savedBlocks.length - 1}###`;
          }
        );
      };
      
      // 预先保存所有的特殊块
      ['script', 'style', 'pre', 'textarea'].forEach(tag => {
        processedHtml = saveSpecialBlocks(processedHtml, tag);
      });
      
      // 移除HTML注释 (但保留条件注释)
      processedHtml = processedHtml.replace(
        /<!--(?![\[\]><])(?:(?!-->).)*-->/gs, 
        ''
      );
      
      // 1. 移除不会影响内容展示的空白字符
      processedHtml = processedHtml
        .replace(/>\s+</g, '><') // 标签之间的空白
        .replace(/\s{2,}/g, ' '); // 连续的空格
      
      // 还原所有保存的块
      savedBlocks.forEach((block, i) => {
        processedHtml = processedHtml.replace(`###SAVED_BLOCK_${i}###`, block);
      });
      
      return processedHtml;
    } catch (error) {
      console.error('HTML压缩失败，返回原始HTML:', error);
      return html; // 出错时返回原始HTML而不是空字符串
    }
  }
}; 