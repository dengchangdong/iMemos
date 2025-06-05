// 常量配置 - 集中管理所有常量
export const CONFIG = {
  FOOTER_TEXT: '© 2024 Memos Themes. All rights reserved.',
  PAGE_LIMIT: '10',
  HEADERS: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  // 正则表达式预编译，提高性能
  REGEX: {
    YOUTUBE: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].+)?/,
    BILIBILI: /https?:\/\/(?:www\.)?bilibili\.com\/video\/(?:(av\d+)|(BV[a-zA-Z0-9]+))(?:[\/?].+)?/,
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
}