/**
 * config.js - 配置模块
 * 集中管理所有常量和配置项
 */

// 应用配置
export const CONFIG = {
  // 应用默认值
  DEFAULTS: {
    FOOTER_TEXT: '© 2024 Memos Themes. All rights reserved.',
    PAGE_LIMIT: 10,
    CACHE_TTL: 60 * 1000, // 缓存有效期：1分钟
    API_CACHE_TTL: 5 * 60 * 1000, // API缓存有效期：5分钟
  },
  
  // HTTP请求头
  HEADERS: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  
  // 正则表达式预编译，分组管理提高可维护性
  REGEX: {
    // 媒体平台链接
    MEDIA: {
      YOUTUBE: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].+)?/,
      BILIBILI: /https?:\/\/(?:www\.)?bilibili\.com\/video\/(?:(av\d+)|(BV[a-zA-Z0-9]+))(?:[\/?].+)?/,
      NETEASE: /https?:\/\/music\.163\.com\/(?:#\/)?song\?id=(\d+)(?:[&?].+)?/,
      DOUYIN: /https?:\/\/(?:www\.)?douyin\.com\/(?:video\/([0-9]+)|.*vid=([0-9]+))(?:[?#].+)?/,
      TIKTOK: /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/([0-9]+)(?:[?#].+)?/,
    },
    
    // 社交平台链接
    SOCIAL: {
      GITHUB: /https?:\/\/github\.com\/([^\/\s]+\/[^\/\s]+)(?:\/)?(?:[#?].+)?/,
      WECHAT: /https?:\/\/mp\.weixin\.qq\.com\/[^\s<"']+/,
      WECHAT_MD: /\[([^\]]+)\]\((https?:\/\/mp\.weixin\.qq\.com\/[^)]+)\)/,
    },
    
    // Markdown语法
    MD: {
      CODE_BLOCK: /```([a-z]*)\n([\s\S]*?)\n```/g,
      INLINE_CODE: /`([^`]+)`/g,
      H1: /^# (.*$)/gm,
      H2: /^## (.*$)/gm,
      H3: /^### (.*$)/gm,
      QUOTE: /^\> (.*)$/gm,
      LIST_ITEM: /^- (.*)$/gm,
      NUM_LIST: /^(\d+)\. (.*)$/gm,
      BOLD: /\*\*(.*?)\*\*/g,
      ITALIC: /\*(.*?)\*/g,
      LINK: /\[([^\]]+)\]\((?!https?:\/\/mp\.weixin\.qq\.com)([^)]+)\)/g,
      IMAGE: /!\[([^\]]*)\]\(([^)]+)\)/g,
    },
    
    // 其他
    TAG: /#([a-zA-Z0-9_\u4e00-\u9fa5]+)/g
  },
  
  // CSS类名 - 主题样式
  CSS: {
    CARD: 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden',
    PROSE: 'prose dark:prose-invert max-w-none',
    LINK: 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors',
    EMBED_CONTAINER: 'my-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800'
  },
  
  // 缓存配置
  CACHE: {
    MAX_SIZE: 100, // 最大缓存条目数
    CLEANUP_INTERVAL: 10 * 60 * 1000, // 清理间隔：10分钟
  }
};

// 导出默认对象
export default CONFIG;