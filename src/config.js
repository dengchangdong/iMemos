/**
 * 常量配置 - 集中管理所有常量
 */
export const CONFIG = {
  /** @type {string} 每页显示的数量限制 */
  PAGE_LIMIT: '10',
  
  /** @type {Object} HTTP请求头 */
  HEADERS: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  
  /** @type {Object} 正则表达式预编译，提高性能 */
  REGEX: {
    /** @type {RegExp} YouTube视频链接匹配 */
    YOUTUBE: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].+)?/,
    /** @type {RegExp} Bilibili视频链接匹配 */
    BILIBILI: /https?:\/\/(?:www\.)?bilibili\.com\/video\/(?:(av\d+)|(BV[a-zA-Z0-9]+))(?:[/?].+)?/,
    /** @type {RegExp} 网易云音乐链接匹配 */
    NETEASE: /https?:\/\/music\.163\.com\/(?:#\/)?song\?id=(\d+)(?:[&?].+)?/,
    /** @type {RegExp} GitHub仓库链接匹配 */
    GITHUB: /https?:\/\/github\.com\/([^\/\s]+\/[^\/\s]+)(?:\/)?(?:[#?].+)?/,
    /** @type {RegExp} 抖音视频链接匹配 */
    DOUYIN: /https?:\/\/(?:www\.)?douyin\.com\/(?:video\/([0-9]+)|.*vid=([0-9]+))(?:[?#].+)?/,
    /** @type {RegExp} TikTok视频链接匹配 */
    TIKTOK: /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/([0-9]+)(?:[?#].+)?/,
    /** @type {RegExp} 微信公众号链接匹配 */
    WECHAT: /https?:\/\/mp\.weixin\.qq\.com\/[^\s<"']+/,
    /** @type {RegExp} Markdown格式的微信公众号链接匹配 */
    WECHAT_MD: /\[([^\]]+)\]\((https?:\/\/mp\.weixin\.qq\.com\/[^)]+)\)/,
    /** @type {RegExp} Markdown代码块匹配 */
    MD_CODE_BLOCK: /```([a-z]*)\n([\s\S]*?)\n```/g,
    /** @type {RegExp} Markdown行内代码匹配 */
    MD_INLINE_CODE: /`([^`]+)`/g,
    /** @type {RegExp} Markdown一级标题匹配 */
    MD_H1: /^# (.*$)/gm,
    /** @type {RegExp} Markdown二级标题匹配 */
    MD_H2: /^## (.*$)/gm,
    /** @type {RegExp} Markdown三级标题匹配 */
    MD_H3: /^### (.*$)/gm,
    /** @type {RegExp} Markdown引用匹配 */
    MD_QUOTE: /^\> (.*)$/gm,
    /** @type {RegExp} Markdown无序列表匹配 */
    MD_LIST_ITEM: /^- (.*)$/gm,
    /** @type {RegExp} Markdown有序列表匹配 */
    MD_NUM_LIST: /^(\d+)\. (.*)$/gm,
    /** @type {RegExp} Markdown加粗匹配 */
    MD_BOLD: /\*\*(.*?)\*\*/g,
    /** @type {RegExp} Markdown斜体匹配 */
    MD_ITALIC: /\*(.*?)\*/g,
    /** @type {RegExp} Markdown链接匹配（排除微信公众号链接） */
    MD_LINK: /\[([^\]]+)\]\((?!https?:\/\/mp\.weixin\.qq\.com)([^)]+)\)/g,
    /** @type {RegExp} Markdown图片匹配 */
    MD_IMAGE: /!\[([^\]]*)\]\(([^)]+)\)/g,
    /** @type {RegExp} 复选框匹配 - [ ]和[x]格式 */
    MD_CHECKBOX: /^(?:\s*[-*+]\s+)?\[([ x])\]\s+(.*)/gm,
    /** @type {RegExp} 单选框匹配 - (x)格式 */
    MD_RADIO: /^(?:\s*[-*+]\s+)?(\([ xo]\))\s+(.*)/gim,
    /** @type {RegExp} 标签匹配 */
    TAG: /#([a-zA-Z0-9_\u4e00-\u9fa5]+)/g
  },
  
  /** @type {Object} CSS类名配置 */
  CSS: {
    /** @type {string} 卡片样式 */
    CARD: 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden',
    /** @type {string} 文章内容样式 */
    PROSE: 'prose dark:prose-invert max-w-none',
    /** @type {string} 链接样式 */
    LINK: 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors',
    /** @type {string} 嵌入容器样式 */
    EMBED_CONTAINER: 'my-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800'
  }
}; 