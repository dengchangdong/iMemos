/**
 * 全局配置对象
 * @type {Object}
 */
export const CONFIG = {
  /**
   * API请求头
   * @type {Object}
   */
  HEADERS: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },

  /**
   * 每页显示数量
   * @type {number}
   */
  PAGE_LIMIT: '10',

  /**
   * 缓存时间（秒）
   * @type {number}
   */
  CACHE_TIME: 300,

  /**
   * 图片加载延迟时间（毫秒）
   * @type {number}
   */
  IMAGE_LOAD_DELAY: 200,

  /**
   * 主题切换动画时间（毫秒）
   * @type {number}
   */
  THEME_TRANSITION_TIME: 300,

  /**
   * 图片预览模态框动画时间（毫秒）
   * @type {number}
   */
  MODAL_TRANSITION_TIME: 300,

  /**
   * 返回顶部按钮显示阈值（像素）
   * @type {number}
   */
  BACK_TO_TOP_THRESHOLD: 300,

  /**
   * 代码复制按钮显示时间（毫秒）
   * @type {number}
   */
  COPY_BUTTON_DISPLAY_TIME: 2000,

  /**
   * 图片懒加载阈值（像素）
   * @type {number}
   */
  LAZY_LOAD_THRESHOLD: 200,

  /**
   * 图片加载失败占位符
   * @type {string}
   */
  IMAGE_PLACEHOLDER: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E',

  /**
   * 主题配置
   * @type {Object}
   */
  THEME: {
    /**
     * 浅色主题配置
     * @type {Object}
     */
    LIGHT: {
      /**
       * 背景渐变色
       * @type {string}
       */
      BACKGROUND_GRADIENT: 'linear-gradient(45deg, #209cff, #68e0cf)',
      
      /**
       * 时间轴颜色
       * @type {string}
       */
      TIMELINE_COLOR: '#4e5ed3',
      
      /**
       * 时间轴阴影颜色
       * @type {string}
       */
      TIMELINE_SHADOW: '#bab5f8'
    },

    /**
     * 深色主题配置
     * @type {Object}
     */
    DARK: {
      /**
       * 背景渐变色
       * @type {string}
       */
      BACKGROUND_GRADIENT: 'linear-gradient(45deg, #0f4c81, #2c7873)',
      
      /**
       * 时间轴颜色
       * @type {string}
       */
      TIMELINE_COLOR: '#818cf8',
      
      /**
       * 时间轴阴影颜色
       * @type {string}
       */
      TIMELINE_SHADOW: '#6366f1'
    }
  },

  // 正则表达式预编译，提高性能
  REGEX: {
    YOUTUBE: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].+)?/,
    BILIBILI: /https?:\/\/(?:www\.)?bilibili\.com\/video\/(?:(av\d+)|(BV[a-zA-Z0-9]+))(?:[/?].+)?/,
    NETEASE: /https?:\/\/music\.163\.com\/(?:#\/)?song\?id=(\d+)(?:[&?].+)?/,
    GITHUB: /https?:\/\/github\.com\/([^\/\s]+\/[^\/\s]+)(?:\/)?(?:[#?].+)?/,
    DOUYIN: /https?:\/\/(?:www\.)?douyin\.com\/(?:video\/([0-9]+)|.*vid=([0-9]+))(?:[?#].+)?/,
    TIKTOK: /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/([0-9]+)(?:[?#].+)?/,
    WECHAT: /https?:\/\/mp\.weixin\.qq\.com\/[^\s<"']+/,
    WECHAT_MD: /\[([^\]]+)\]\((https?:\/\/mp\.weixin\.qq\.com\/[^)]+)\)/,
    MD_CODE_BLOCK: /```([a-z]*)\n([\s\S]*?)\n```/g,
    MD_INLINE_CODE: /`([^`]+)`/g,
    MD_H1: /^# (.*$)/gm,
    MD_H2: /^## (.*$)/gm,
    MD_H3: /^### (.*$)/gm,
    MD_QUOTE: /^\> (.*)$/gm,
    MD_LIST_ITEM: /^- (.*)$/gm,
    MD_NUM_LIST: /^(\d+)\. (.*)$/gm,
    MD_BOLD: /\*\*(.*?)\*\*/g,
    MD_ITALIC: /\*(.*?)\*/g,
    MD_LINK: /\[([^\]]+)\]\((?!https?:\/\/mp\.weixin\.qq\.com)([^)]+)\)/g,
    MD_IMAGE: /!\[([^\]]*)\]\(([^)]+)\)/g,
    TAG: /#([a-zA-Z0-9_\u4e00-\u9fa5]+)/g
  },

  CSS: {
    CARD: 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden',
    PROSE: 'prose dark:prose-invert max-w-none',
    LINK: 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors',
    EMBED_CONTAINER: 'my-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800'
  }
}; 