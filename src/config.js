// 常量配置 - 集中管理所有常量
export const CONFIG = {
  PAGE_LIMIT: '10',
  HEADERS: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  
  // 正则表达式 - 使用命名对象组织相关正则
  REGEX: {
    // 媒体链接
    MEDIA: {
      YOUTUBE: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].+)?/,
      BILIBILI: /https?:\/\/(?:www\.)?bilibili\.com\/video\/(?:(av\d+)|(BV[a-zA-Z0-9]+))(?:[/?].+)?/,
      NETEASE: /https?:\/\/music\.163\.com\/(?:#\/)?song\?id=(\d+)(?:[&?].+)?/,
      DOUYIN: /https?:\/\/(?:www\.)?douyin\.com\/(?:video\/([0-9]+)|.*vid=([0-9]+))(?:[?#].+)?/,
      TIKTOK: /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/([0-9]+)(?:[?#].+)?/,
    },
    
    // 其他链接
    LINKS: {
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
  
  // CSS类名 - 使用更语义化的命名
  CSS: {
    CARD: 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden',
    PROSE: 'prose dark:prose-invert max-w-none',
    LINK: 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors',
    EMBED_CONTAINER: 'my-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800'
  }
}; 