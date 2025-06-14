// 常量配置
export const CONFIG = {
  // 分页配置
  PAGE_LIMIT: '10',
  
  // HTTP 请求头
  HEADERS: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  
  // 正则表达式配置
  REGEX: {
    // 视频平台
    VIDEO: {
      YOUTUBE: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].+)?/,
      BILIBILI: /https?:\/\/(?:www\.)?bilibili\.com\/video\/(?:(av\d+)|(BV[a-zA-Z0-9]+))(?:[/?].+)?/,
      DOUYIN: /https?:\/\/(?:www\.)?douyin\.com\/(?:video\/([0-9]+)|.*vid=([0-9]+))(?:[?#].+)?/,
      TIKTOK: /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/([0-9]+)(?:[?#].+)?/
    },
    
    // 音乐平台
    MUSIC: {
      NETEASE: /https?:\/\/music\.163\.com\/(?:#\/)?song\?id=(\d+)(?:[&?].+)?/
    },
    
    // 社交媒体
    SOCIAL: {
      GITHUB: /https?:\/\/github\.com\/([^\/\s]+\/[^\/\s]+)(?:\/)?(?:[#?].+)?/,
      WECHAT: /https?:\/\/mp\.weixin\.qq\.com\/[^\s<"']+/,
      WECHAT_MD: /\[([^\]]+)\]\((https?:\/\/mp\.weixin\.qq\.com\/[^)]+)\)/
    },
    
    // Markdown 语法
    MARKDOWN: {
      CODE_BLOCK: /```([a-z]*)\n([\s\S]*?)\n```/g,
      INLINE_CODE: /`([^`]+)`/g,
      HEADERS: {
        H1: /^# (.*$)/gm,
        H2: /^## (.*$)/gm,
        H3: /^### (.*$)/gm
      },
      QUOTE: /^\> (.*)$/gm,
      LISTS: {
        UNORDERED: /^- (.*)$/gm,
        ORDERED: /^(\d+)\. (.*)$/gm
      },
      TEXT: {
        BOLD: /\*\*(.*?)\*\*/g,
        ITALIC: /\*(.*?)\*/g
      },
      LINKS: {
        NORMAL: /\[([^\]]+)\]\((?!https?:\/\/mp\.weixin\.qq\.com)([^)]+)\)/g,
        IMAGE: /!\[([^\]]*)\]\(([^)]+)\)/g
      }
    },
    
    // 标签
    TAG: /#([a-zA-Z0-9_\u4e00-\u9fa5]+)/g
  },
  
  // CSS 类名配置
  CSS: {
    CARD: 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden',
    PROSE: 'prose dark:prose-invert max-w-none',
    LINK: 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors',
    EMBED_CONTAINER: 'my-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800'
  }
}; 