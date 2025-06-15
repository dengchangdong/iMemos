// 帮助函数 - 工具集
export const utils = {
  /**
   * HTML转义，防止XSS攻击。
   * @param {string} text - 待转义的文本。
   * @returns {string} 转义后的文本。
   */
  escapeHtml(text) {
    // 性能考虑：如果文本不包含任何需要转义的字符，则直接返回
    if (!/[&<>"']/.test(text)) {
      return text;
    }
    return text
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """)
      .replace(/'/g, "'");
  },

  /**
   * 格式化时间戳为用户友好的字符串（如“刚刚”，“X分钟前”，“X小时前”，或特定日期格式）。
   * 优先使用相对时间格式，然后是日期格式。
   * @param {number|string} timestamp - 时间戳（毫秒或ISO字符串）。
   * @returns {string} 格式化后的时间字符串。
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime(); // 毫秒差

    // Helper for relative time formatting
    const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto', style: 'long' });

    // 5分钟以内
    if (diffMs < 5 * 60 * 1000) { // 5 minutes
      return '刚刚';
    }

    // 1小时以内
    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 60) {
      return rtf.format(-minutes, 'minute');
    }

    // 24小时以内
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    // 检查是否是同一天，避免跨天但不足24小时的情况显示为“昨天”或“前天”
    // 这里采用更精确的判断：是否在过去24小时内
    if (hours < 24) {
      return rtf.format(-hours, 'hour');
    }

    // 判断是否在当年
    if (date.getFullYear() === now.getFullYear()) {
      // 当年发布的，格式： MM-DD HH:mm
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // 24小时制
      }).replace(/\//g, '-'); // 将默认的斜杠替换为破折号
    }

    // 非当年发布的，格式： YYYY-MM-DD HH:mm
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
  },

  /**
   * 创建HTML元素（用于模板字面量）。
   * 等同于String.raw，但封装在utils中便于访问。
   * @param {TemplateStringsArray} strings - 模板字符串数组。
   * @param {...any} values - 模板字符串中的变量值。
   * @returns {string} 原始（未处理转义字符的）HTML字符串。
   */
  createHtml(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  },

  /**
   * 按时间降序排序memos数组。
   * @param {Array<object>} memos - 包含memo对象的数组。
   * @returns {Array<object>} 排序后的新数组，原始数组不会被修改。
   */
  sortMemosByTime(memos) {
    if (!Array.isArray(memos)) {
      console.warn('sortMemosByTime: Input is not an array, returning empty array.');
      return [];
    }

    // 使用扩展运算符创建数组的浅拷贝，避免修改原始数组
    return [...memos].sort((a, b) => {
      // 优先使用 createTime (ISO string)，如果不存在则使用 createdTs (Unix timestamp in seconds)
      const timeA = a.createTime
        ? new Date(a.createTime).getTime()
        : (typeof a.createdTs === 'number' ? a.createdTs * 1000 : 0); // 确保是数字，并转换为毫秒
      const timeB = b.createTime
        ? new Date(b.createTime).getTime()
        : (typeof b.createdTs === 'number' ? b.createdTs * 1000 : 0); // 确保是数字，并转换为毫秒

      // 如果时间戳无效（例如为0），则视为相等，保持原顺序
      if (isNaN(timeA) || isNaN(timeB)) {
        console.warn('sortMemosByTime: Invalid timestamp found in memo, may affect sort order.');
        return 0;
      }

      return timeB - timeA; // 降序排列 (新的在前)
    });
  }
};