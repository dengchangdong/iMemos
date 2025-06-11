// 常量配置 - 集中管理所有常量
export const CONFIG = {
  // 基础配置
  API: {
    PAGE_LIMIT: '10',
    HEADERS: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    },
    CACHE_TTL: 60 * 1000 // 缓存有效期1分钟
  },
  
  // 正则表达式预编译，提高性能
  REGEX: {
    // 媒体嵌入
    YOUTUBE: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].+)?/,
    BILIBILI: /https?:\/\/(?:www\.)?bilibili\.com\/video\/(?:(av\d+)|(BV[a-zA-Z0-9]+))(?:[/?].+)?/,
    NETEASE: /https?:\/\/music\.163\.com\/(?:#\/)?song\?id=(\d+)(?:[&?].+)?/,
    GITHUB: /https?:\/\/github\.com\/([^\/\s]+\/[^\/\s]+)(?:\/)?(?:[#?].+)?/,
    DOUYIN: /https?:\/\/(?:www\.)?douyin\.com\/(?:video\/([0-9]+)|.*vid=([0-9]+))(?:[?#].+)?/,
    TIKTOK: /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/([0-9]+)(?:[?#].+)?/,
    WECHAT: /https?:\/\/mp\.weixin\.qq\.com\/[^\s<"']+/,
    WECHAT_MD: /\[([^\]]+)\]\((https?:\/\/mp\.weixin\.qq\.com\/[^)]+)\)/,
    
    // Markdown解析
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
  
  // CSS类名
  CSS: {
    CARD: 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden',
    PROSE: 'prose dark:prose-invert max-w-none',
    LINK: 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors',
    EMBED_CONTAINER: 'my-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800'
  },
  
  // 默认值
  DEFAULTS: {
    SITE_NAME: 'iMemos',
    NAV_LINKS: '{}',
    PAGE_LIMIT: 10
  }
}; 

// 导出常用配置，方便访问
export const PAGE_LIMIT = CONFIG.API.PAGE_LIMIT;
export const HEADERS = CONFIG.API.HEADERS; 