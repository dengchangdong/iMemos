/**
 * 正则表达式配置
 */
export const REGEX_CONFIG = {
  // 视频平台
  YOUTUBE: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].+)?/,
  BILIBILI: /https?:\/\/(?:www\.)?bilibili\.com\/video\/(?:(av\d+)|(BV[a-zA-Z0-9]+))(?:[/?].+)?/,
  NETEASE: /https?:\/\/music\.163\.com\/(?:#\/)?song\?id=(\d+)(?:[&?].+)?/,
  GITHUB: /https?:\/\/github\.com\/([^\/\s]+\/[^\/\s]+)(?:\/)?(?:[#?].+)?/,
  DOUYIN: /https?:\/\/(?:www\.)?douyin\.com\/(?:video\/([0-9]+)|.*vid=([0-9]+))(?:[?#].+)?/,
  TIKTOK: /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/([0-9]+)(?:[?#].+)?/,
  
  // 社交媒体
  WECHAT: /https?:\/\/mp\.weixin\.qq\.com\/[^\s<"']+/,
  WECHAT_MD: /\[([^\]]+)\]\((https?:\/\/mp\.weixin\.qq\.com\/[^)]+)\)/,
  
  // Markdown语法
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
  
  // 标签
  TAG: /#([a-zA-Z0-9_\u4e00-\u9fa5]+)/g
}; 