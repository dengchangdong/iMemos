import { Hono } from 'hono'

const app = new Hono()

// 常量配置 - 更优雅的结构和命名
const CONFIG = {
  // 应用基本配置
  APP: {
    FOOTER_TEXT: '© 2024 Memos Themes. All rights reserved.',
    PAGE_LIMIT: '10'
  },
  
  // 网络请求相关配置
  HTTP: {
    HEADERS: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    },
    CACHE_TTL: 60 * 1000 // 缓存有效期（1分钟）
  },
  
  // CSS类名常量
  CSS: {
    CARD: 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden',
    PROSE: 'prose dark:prose-invert max-w-none',
    LINK: 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors',
    EMBED: {
      CONTAINER: 'my-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800',
      DOUYIN: 'douyin-container'
    }
  }
}

// 正则表达式 - 单独管理，提高性能
const REGEX = {
  // 媒体平台
  YOUTUBE: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].+)?/,
  BILIBILI: /https?:\/\/(?:www\.)?bilibili\.com\/video\/(?:(av\d+)|(BV[a-zA-Z0-9]+))(?:[/?].+)?/,
  NETEASE: /https?:\/\/music\.163\.com\/(?:#\/)?song\?id=(\d+)(?:[&?].+)?/,
  GITHUB: /https?:\/\/github\.com\/([^\/\s]+\/[^\/\s]+)(?:\/)?(?:[#?].+)?/,
  DOUYIN: /https?:\/\/(?:www\.)?douyin\.com\/(?:video\/([0-9]+)|.*vid=([0-9]+))(?:[?#].+)?/,
  TIKTOK: /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/([0-9]+)(?:[?#].+)?/,
  WECHAT: /https?:\/\/mp\.weixin\.qq\.com\/[^\s<"']+/,
  WECHAT_MD: /\[([^\]]+)\]\((https?:\/\/mp\.weixin\.qq\.com\/[^)]+)\)/,
  
  // Markdown 语法
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
  TAG: /#([a-zA-Z0-9_\u4e00-\u9fa5]+)/g,
  URL: /(^|[^"=])(https?:\/\/(?!mp\.weixin\.qq\.com)[^\s<]+[^<.,:;"')\]\s])/g
}

// 帮助函数 - 工具集
const utils = {
  /**
   * HTML转义，防止XSS攻击
   * @param {string} text - 需要转义的文本
   * @return {string} 转义后的安全文本
   */
  escapeHtml(text) {
    if (!text) return '';
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => escapeMap[char]);
  },
  
  /**
   * 智能格式化时间，根据时间间隔返回不同格式
   * @param {number} timestamp - 时间戳(毫秒)
   * @return {string} 格式化后的时间字符串
   */
  formatTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    
    // 时间间隔常量
    const MINUTE = 60 * 1000;
    const HOUR = MINUTE * 60;
    const DAY = HOUR * 24;
    
    // 刚刚（1分钟内）
    if (diff < MINUTE) return '刚刚';
    
    // N分钟前（1小时内）
    if (diff < HOUR) return `${Math.floor(diff / MINUTE)} 分钟前`;
    
    // N小时前（当天24小时内）
    if (diff < DAY && date.getDate() === now.getDate()) 
      return `${Math.floor(diff / HOUR)} 小时前`;
    
    // 当年内显示月日时分
    if (date.getFullYear() === now.getFullYear()) {
      return this.formatDate(date, {
        month: true,
        day: true,
        hour: true,
        minute: true
      });
    }
    
    // 非当年显示年月日时分
    return this.formatDate(date, {
      year: true,
      month: true,
      day: true,
      hour: true,
      minute: true
    });
  },
  
  /**
   * 格式化日期
   * @param {Date} date - 日期对象
   * @param {Object} options - 格式化选项
   * @return {string} 格式化后的日期字符串
   */
  formatDate(date, { year = false, month = false, day = false, hour = false, minute = false }) {
    const parts = [];
    
    if (year) parts.push(date.getFullYear());
    if (month) parts.push(String(date.getMonth() + 1).padStart(2, '0'));
    if (day) parts.push(String(date.getDate()).padStart(2, '0'));
    
    let result = parts.join('-');
    
    if (hour || minute) {
      const timeParts = [];
      if (hour) timeParts.push(String(date.getHours()).padStart(2, '0'));
      if (minute) timeParts.push(String(date.getMinutes()).padStart(2, '0'));
      
      result += ' ' + timeParts.join(':');
    }
    
    return result;
  },
  
  /**
   * 创建HTML模板字符串，支持模板变量
   * @return {string} 处理后的HTML字符串
   */
  createHtml(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  },
  
  /**
   * 处理URL，确保安全性
   * @param {string} url - 原始URL
   * @return {string} 处理后的安全URL
   */
  safeUrl(url) {
    if (!url || typeof url !== 'string') return '';
    
    // 将XSS危险字符转换为URL编码
    return url.replace(/[<>"']/g, match => {
      switch (match) {
        case '<': return '%3C';
        case '>': return '%3E';
        case '"': return '%22';
        case "'": return '%27';
        default: return match;
      }
    });
  },
  
  /**
   * 去除HTML标签，返回纯文本
   * @param {string} html - 包含HTML标签的字符串
   * @return {string} 纯文本内容
   */
  stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  },
  
  /**
   * 截断文本，超出长度添加省略号
   * @param {string} text - 原始文本
   * @param {number} length - 最大长度
   * @return {string} 处理后的文本
   */
  truncate(text, length = 100) {
    if (!text || text.length <= length) return text;
    return text.slice(0, length) + '...';
  }
}

// Markdown渲染核心 - 使用缓存和高效处理
class MarkdownRenderer {
  constructor() {
    // 处理缓存 - 使用Map提高查找效率
    this.cache = new Map();
    
    // 渲染器选项
    this.options = {
      linkClass: CONFIG.CSS.LINK,
      embedContainer: CONFIG.CSS.EMBED.CONTAINER,
      douyinContainer: CONFIG.CSS.EMBED.DOUYIN
    };
  }
  
  /**
   * 主渲染入口
   * @param {string} text - 原始文本
   * @return {string} 渲染后的HTML
   */
  render(text) {
    if (!text) return '';
    
    // 检查缓存
    const cacheKey = text;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // 检测是否需要处理特殊链接
    const containsSpecialLinks = this.containsSpecialLinks(text);
    
    // 处理流程 - 根据内容特性选择处理顺序
    let html;
    if (containsSpecialLinks) {
      // 先处理特殊链接再渲染Markdown
      const preProcessed = this.processSpecialLinks(text);
      html = this.renderToHtml(preProcessed);
    } else {
      // 正常渲染Markdown后处理特殊链接
      html = this.renderToHtml(text);
      html = this.processSpecialLinks(html);
    }
    
    // 存入缓存
    this.cache.set(cacheKey, html);
    return html;
  }
  
  /**
   * 检测文本是否包含特殊平台链接
   * @param {string} text - 待检测文本
   * @return {boolean} 是否包含特殊链接
   */
  containsSpecialLinks(text) {
    return (
      text.includes('youtube.com') || 
      text.includes('bilibili.com') || 
      text.includes('douyin.com') || 
      text.includes('tiktok.com') || 
      text.includes('music.163.com') || 
      text.includes('github.com') || 
      text.includes('mp.weixin.qq.com')
    );
  }
  
  /**
   * 检测文本是否已包含Markdown格式
   * @param {string} text - 待检测文本
   * @return {boolean} 是否包含Markdown格式
   */
  containsMarkdown(text) {
    return (
      text.includes('# ') || 
      text.includes('## ') || 
      text.includes('### ') || 
      text.includes('```') || 
      text.includes('*') || 
      text.includes('> ') ||
      /\[.*\]\(.*\)/.test(text)
    );
  }
  
  /**
   * 确保内容是Markdown格式
   * @param {string} text - 原始文本
   * @return {string} 处理后的文本
   */
  ensureMarkdown(text) {
    // 如果已经是Markdown格式，直接返回
    return this.containsMarkdown(text) ? text : text;
  }
  
  /**
   * 将Markdown渲染为HTML
   * @param {string} text - Markdown文本
   * @return {string} 渲染后的HTML
   */
  renderToHtml(text) {
    // 预处理
    let html = this.ensureMarkdown(text);
    
    // 分段处理 - 将连续的换行转换为段落分隔
    html = html.replace(/\n{2,}/g, '\n\n');
    
    // 代码块处理
    html = this.renderCodeBlocks(html);
    
    // 行内元素处理
    html = this.renderInlineElements(html);
    
    // 块级元素处理
    html = this.renderBlockElements(html);
    
    // 链接处理
    html = this.renderLinks(html);
    
    // 段落处理
    html = this.renderParagraphs(html);
    
    return html;
  }
  
  /**
   * 渲染代码块
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  renderCodeBlocks(html) {
    // 代码块
    html = html.replace(REGEX.MD_CODE_BLOCK, (match, lang, code) => 
      utils.createHtml`<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto my-4"><code class="language-${lang || 'plaintext'}">${utils.escapeHtml(code)}</code></pre>`
    );
    
    // 行内代码
    html = html.replace(REGEX.MD_INLINE_CODE, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">$1</code>');
    
    return html;
  }
  
  /**
   * 渲染行内元素
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  renderInlineElements(html) {
    // 粗体
    html = html.replace(REGEX.MD_BOLD, '<strong>$1</strong>');
    
    // 斜体
    html = html.replace(REGEX.MD_ITALIC, '<em>$1</em>');
    
    return html;
  }
  
  /**
   * 渲染块级元素
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  renderBlockElements(html) {
    // 标题
    html = html.replace(REGEX.MD_H1, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
    html = html.replace(REGEX.MD_H2, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');
    html = html.replace(REGEX.MD_H3, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    
    // 引用
    html = html.replace(REGEX.MD_QUOTE, '<blockquote class="pl-4 border-l-4 border-gray-300 dark:border-gray-600 my-4 text-gray-600 dark:text-gray-400">$1</blockquote>');
    
    // 列表项
    html = html.replace(REGEX.MD_LIST_ITEM, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(REGEX.MD_NUM_LIST, '<li class="ml-4 list-decimal">$2</li>');
    
    // 包装列表
    html = html.replace(/(<li.*>.*<\/li>\n)+/g, (match) => {
      return match.includes('list-decimal') 
        ? `<ol class="my-4">${match}</ol>` 
        : `<ul class="my-4">${match}</ul>`;
    });
    
    return html;
  }
  
  /**
   * 渲染链接、图片和标签
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  renderLinks(html) {
    // 处理图片 - 添加懒加载和预览支持
    html = html.replace(REGEX.MD_IMAGE, 
      '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4" loading="lazy" data-preview="true" />'
    );
    
    // 处理链接 - 排除微信链接（由特殊链接处理器处理）
    html = html.replace(REGEX.MD_LINK, (match, text, url) => {
      // 保持URL原样，不对特殊字符进行转义
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${this.options.linkClass}">${text}</a>`;
    });
    
    // 处理标签
    html = html.replace(REGEX.TAG, (match, tag) => {
      return `<a href="/tag/${tag}" class="${this.options.linkClass}">#${tag}</a>`;
    });
    
    // 处理普通URL - 避免处理已经在标签内的URL
    html = html.replace(REGEX.URL, (match, prefix, url) => {
      return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="${this.options.linkClass}">${url}</a>`;
    });
    
    return html;
  }
  
  /**
   * 渲染段落
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  renderParagraphs(html) {
    // 将文本分割为段落
    const paragraphs = html.split('\n\n');
    
    // 处理每个段落
    return paragraphs.map(para => {
      // 如果段落已经包含块级元素标签，不再包装
      if (para.trim() === '' || /^<(h[1-6]|pre|blockquote|ul|ol|div|p)/.test(para)) {
        return para;
      }
      // 替换段落内的单个换行为<br>
      return `<p class="text-gray-800 dark:text-gray-200 leading-relaxed">${para.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
  }
  
  /**
   * 处理特殊链接 - 高效精简实现
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  processSpecialLinks(html) {
    // 对于已经处理过的HTML内容，直接返回，避免重复处理
    if (html.includes('<iframe') || html.includes(`<div class="${this.options.embedContainer}">`)) {
      return html;
    }
    
    // 处理所有特殊链接类型
    html = this.processMediaPlatforms(html);
    
    return html;
  }
  
  /**
   * 处理所有媒体平台链接
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  processMediaPlatforms(html) {
    // 微信公众号链接处理
    html = this.processWechatLinks(html);
    
    // 视频平台处理
    html = this.processVideoLinks(html);
    
    // 音乐平台处理
    html = this.processMusicLinks(html);
    
    // GitHub仓库处理
    html = this.processGithubLinks(html);
    
    return html;
  }
  
  /**
   * 处理微信公众号链接
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  processWechatLinks(html) {
    // Markdown格式微信链接
    html = this.processLinkWithRegex(html, REGEX.WECHAT_MD, (match, title, url) => {
      return this.createWechatCard(url, title);
    });
    
    // 普通微信链接
    html = this.processLinkWithRegex(html, REGEX.WECHAT, (match) => {
      return this.createWechatCard(match, '微信公众号文章');
    });
    
    return html;
  }
  
  /**
   * 处理视频平台链接
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  processVideoLinks(html) {
    // YouTube视频
    html = this.processEmbedWithRegex(html, REGEX.YOUTUBE, {
      embedSrc: (match, videoId) => {
        if (!videoId || typeof videoId !== 'string') return '';
        return `https://www.youtube.com/embed/${videoId}?autoplay=0`;
      },
      attributes: 'class="w-full aspect-video" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen'
    });
    
    // Bilibili视频
    html = this.processEmbedWithRegex(html, REGEX.BILIBILI, {
      embedSrc: (match, avid, bvid) => {
        if (bvid && typeof bvid === 'string') {
          return `https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1&danmaku=0&autoplay=0`;
        } else if (avid && typeof avid === 'string') {
          const aid = avid.startsWith('av') ? avid.slice(2) : avid;
          return `https://player.bilibili.com/player.html?aid=${aid}&high_quality=1&danmaku=0&autoplay=0`;
        }
        return '';
      },
      attributes: 'class="w-full aspect-video" scrolling="no" frameborder="no" allowfullscreen sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups" referrerpolicy="no-referrer"'
    });
    
    // 抖音视频
    html = this.processEmbedWithRegex(html, REGEX.DOUYIN, {
      embedSrc: (match, videoId, vidParam) => {
        const finalVideoId = videoId || vidParam;
        if (!finalVideoId || typeof finalVideoId !== 'string') return '';
        return `https://open.douyin.com/player/video?vid=${finalVideoId}&autoplay=0`;
      },
      attributes: 'style="aspect-ratio: .4821; width: min(324px, 100%); margin: auto;" scrolling="no" frameborder="no" allowfullscreen referrerpolicy="unsafe-url"'
    });
    
    // TikTok视频
    html = this.processEmbedWithRegex(html, REGEX.TIKTOK, {
      embedSrc: (match, videoId) => {
        if (!videoId || typeof videoId !== 'string') return '';
        return `https://www.tiktok.com/embed/v2/${videoId}?autoplay=0`;
      },
      attributes: 'class="w-full aspect-video" scrolling="no" frameborder="no" allowfullscreen'
    });
    
    return html;
  }
  
  /**
   * 处理音乐平台链接
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  processMusicLinks(html) {
    // 网易云音乐
    html = this.processEmbedWithRegex(html, REGEX.NETEASE, {
      embedSrc: (match, songId) => {
        if (!songId || typeof songId !== 'string') return '';
        return `//music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`;
      },
      attributes: 'class="w-full h-[86px]" frameborder="no" border="0" marginwidth="0" marginheight="0"'
    });
    
    return html;
  }
  
  /**
   * 处理GitHub仓库链接
   * @param {string} html - 输入HTML
   * @return {string} 处理后的HTML
   */
  processGithubLinks(html) {
    // GitHub仓库链接
    html = this.processLinkWithRegex(html, REGEX.GITHUB, (match, repo) => {
      return utils.createHtml`<div class="my-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center space-x-3">
        <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <a href="${match}" target="_blank" rel="noopener noreferrer" class="${this.options.linkClass}">
          ${repo}
        </a>
      </div>`;
    });
    
    return html;
  }
  
  /**
   * 通用链接处理函数
   * @param {string} html - 输入HTML
   * @param {RegExp} regex - 匹配的正则表达式
   * @param {Function} processor - 处理函数
   * @return {string} 处理后的HTML
   */
  processLinkWithRegex(html, regex, processor) {
    const processedMarker = {};
    
    return html.replace(new RegExp(regex.source, 'g'), (match, ...args) => {
      // 生成唯一标记
      const markerId = match.slice(0, 20) + (args[0] || '');
      
      // 检查是否已处理
      if (processedMarker[markerId]) return match;
      
      // 检查链接是否已在a标签内
      if (new RegExp(`href=["']${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(html)) {
        return match;
      }
      
      // 标记为已处理
      processedMarker[markerId] = true;
      
      try {
        return processor(match, ...args);
      } catch (error) {
        console.error('链接处理错误:', error, match, args);
        return match;
      }
    });
  }
  
  /**
   * 通用嵌入内容处理函数
   * @param {string} html - 输入HTML
   * @param {RegExp} regex - 匹配的正则表达式
   * @param {Object} config - 嵌入配置
   * @return {string} 处理后的HTML
   */
  processEmbedWithRegex(html, regex, config) {
    const processedMarker = {};
    
    return html.replace(new RegExp(regex.source, 'g'), (match, ...args) => {
      // 生成唯一标记
      const markerId = match.slice(0, 20) + (args[0] || '');
      
      // 检查是否已处理
      if (processedMarker[markerId]) return match;
      
      // 标记为已处理
      processedMarker[markerId] = true;
      
      try {
        // 生成嵌入源URL
        const embedSrc = typeof config.embedSrc === 'function' 
          ? config.embedSrc(match, ...args) 
          : '';
        
        // 检查有效性
        if (!embedSrc) {
          console.error('无法生成嵌入源:', match, args);
          return match;
        }
        
        // 检查是否已经嵌入
        if (html.includes(`src="${embedSrc}"`) || 
            html.includes(`src="${embedSrc.replace('http:', '')}"`)) {
          return match;
        }
        
        // 抖音视频需要特殊的容器样式
        const isDouyin = embedSrc.includes('open.douyin.com');
        const containerClass = isDouyin 
          ? `${this.options.embedContainer} ${this.options.douyinContainer}` 
          : this.options.embedContainer;
        
        return utils.createHtml`<div class="${containerClass}">
          <iframe src="${embedSrc}" 
                  ${config.attributes || ''}
                  loading="lazy"></iframe>
        </div>`;
      } catch (error) {
        console.error('嵌入处理错误:', error, match, args);
        return match;
      }
    });
  }
  
  /**
   * 创建微信公众号卡片
   * @param {string} url - 微信链接
   * @param {string} title - 卡片标题
   * @return {string} 卡片HTML
   */
  createWechatCard(url, title = '微信公众号文章') {
    if (!url || typeof url !== 'string') {
      console.error('无效的微信公众号URL:', url);
      return '';
    }
    
    // 安全处理URL和标题
    url = utils.safeUrl(url);
    title = utils.escapeHtml(title);
    
    return utils.createHtml`<div class="my-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center space-x-3">
      <svg class="w-6 h-6 text-green-600 dark:text-green-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.328.328 0 00.166-.054l1.9-1.106a.598.598 0 01.504-.042 10.284 10.284 0 003.055.462c.079 0 .158-.001.237-.003a3.57 3.57 0 00-.213-1.88 7.354 7.354 0 01-4.53-6.924c0-3.195 2.738-5.766 6.278-5.951h.043l.084-.001c.079 0 .158 0 .237.003 3.738.186 6.705 2.875 6.705 6.277 0 3.073-2.81 5.597-6.368 5.806a.596.596 0 00-.212.043c-.09.019-.166.07-.237.117h-.036c-.213 0-.416-.036-.618-.073l-.6-.083a.71.71 0 00-.213-.035 1.897 1.897 0 00-.59.095l-1.208.581a.422.422 0 01-.16.036c-.164 0-.295-.13-.295-.295 0-.059.019-.118.037-.165l.075-.188.371-.943c.055-.14.055-.295-.018-.413a3.68 3.68 0 01-.96-1.823c-.13-.414-.206-.846-.213-1.278a3.75 3.75 0 01.891-2.431c-.002 0-.002-.001-.003-.004a5.7 5.7 0 01-.493.046c-.055.003-.11.004-.165.004-4.801 0-8.691-3.288-8.691-7.345 0-4.056 3.89-7.346 8.691-7.346M18.3 15.342a.496.496 0 01.496.496.509.509 0 01-.496.496.509.509 0 01-.497-.496.497.497 0 01.497-.496m-4.954 0a.496.496 0 01.496.496.509.509 0 01-.496.496.509.509 0 01-.497-.496.497.497 0 01.497-.496M23.999 17.33c0-3.15-3.043-5.73-6.786-5.943a7.391 7.391 0 00-.283-.004c-3.849 0-7.067 2.721-7.067 6.23 0 3.459 3.055 6.175 6.848 6.227.059.001.118.003.177.003a8.302 8.302 0 002.484-.377.51.51 0 01.426.035l1.59.93c.06.036.118.048.177.048.142 0 .26-.118.26-.26 0-.07-.018-.13-.048-.189l-.331-1.243a.515.515 0 01.178-.555c1.563-1.091 2.575-2.765 2.575-4.902"/>
      </svg>
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="${this.options.linkClass} flex-1 truncate">
        ${title}
      </a>
    </div>`;
  }
}

// 初始化渲染器实例
const markdownRenderer = new MarkdownRenderer();

// 简化外部调用接口
function simpleMarkdown(text) {
  return markdownRenderer.render(text);
}

// 错误处理中间件
app.use('*', async (c, next) => {
  try {
    await next()
  } catch (err) {
    console.error('错误:', err)
    return c.text('服务器错误', 500)
  }
})

// API处理相关 - 优化HTTP请求和缓存
class ApiHandler {
  constructor() {
    // 数据缓存
    this.cache = new Map();
  }
  
  /**
   * 从缓存中获取数据
   * @param {string} key - 缓存键
   * @param {number} ttl - 缓存有效期（毫秒）
   * @return {*} 缓存数据或null
   */
  getFromCache(key, ttl) {
    const cachedData = this.cache.get(key);
    if (cachedData && cachedData.timestamp > Date.now() - ttl) {
      return cachedData.data;
    }
    return null;
  }
  
  /**
   * 将数据存入缓存
   * @param {string} key - 缓存键
   * @param {*} data - 要缓存的数据
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * 获取memos数据
   * @param {Context} c - Hono上下文
   * @param {string} tag - 标签过滤
   * @return {Promise<Array>} memos数据
   */
  async fetchMemos(c, tag = '') {
    try {
      const limit = c.env.PAGE_LIMIT || CONFIG.APP.PAGE_LIMIT;
      const cacheKey = `memos_${tag}_${limit}`;
      const ttl = CONFIG.HTTP.CACHE_TTL;
      
      // 检查缓存
      const cachedData = this.getFromCache(cacheKey, ttl);
      if (cachedData) {
        return cachedData;
      }
      
      // 构建API URL
      const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=0`;
      
      // 发送请求
      const response = await fetch(apiUrl, { headers: CONFIG.HTTP.HEADERS });
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      // 解析数据
      const data = await response.json();
      
      // 更新缓存
      this.setCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('获取 memos 数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取单条memo
   * @param {Context} c - Hono上下文
   * @param {string} name - memo标识
   * @return {Promise<Object|null>} memo数据
   */
  async fetchMemo(c, name) {
    try {
      const cacheKey = `memo_${name}`;
      const ttl = CONFIG.HTTP.CACHE_TTL;
      
      // 检查缓存
      const cachedData = this.getFromCache(cacheKey, ttl);
      if (cachedData) {
        return cachedData;
      }
      
      // 构建API URL
      const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`;
      
      // 发送请求
      const response = await fetch(apiUrl, { headers: CONFIG.HTTP.HEADERS });
      if (!response.ok) {
        return null;
      }

      // 解析数据
      const data = await response.json();
      
      // 更新缓存
      this.setCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('获取单条 memo 数据失败:', error);
      return null;
    }
  }
}

// 实例化API处理器
const apiHandler = new ApiHandler();

/**
 * 渲染单个 memo
 * @param {Object} memo - memo数据
 * @param {boolean} isHomePage - 是否在首页展示
 * @return {string} 渲染后的HTML
 */
function renderMemo(memo, isHomePage = false) {
  try {
    const timestamp = memo.createTime 
      ? new Date(memo.createTime).getTime()
      : memo.createdTs * 1000;
    const date = utils.formatTime(timestamp);
    
    // 使用简易Markdown渲染内容
    const content = memo.content || '';
    const parsedContent = simpleMarkdown(content);
    
    // 资源处理 - 图片预览优化
    const resources = memo.resources || memo.resourceList || [];
    
    // 只在有资源时生成HTML
    const resourcesHtml = resources.length > 0 
      ? renderResources(resources)
      : '';
    
    // 根据页面类型生成时间HTML
    const timeHtml = isHomePage 
      ? utils.createHtml`<time class="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">
           <a href="/post/${memo.name}" class="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
             ${date}
           </a>
         </time>`
      : utils.createHtml`<time class="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">${date}</time>`;
    
    // 组合最终HTML
    return utils.createHtml`
      <article class="${CONFIG.CSS.CARD}">
        <div class="p-6 sm:p-8">
          ${timeHtml}
          <div class="mt-4 ${CONFIG.CSS.PROSE}">
            ${parsedContent}
          </div>
          ${resourcesHtml}
        </div>
      </article>
    `;
  } catch (error) {
    console.error('渲染 memo 失败:', error);
    return utils.createHtml`
      <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        <p class="font-medium">渲染失败</p>
        <p class="text-sm mt-1">${error.message}</p>
      </div>
    `;
  }
}

/**
 * 渲染资源列表
 * @param {Array} resources - 资源列表
 * @return {string} 渲染后的HTML
 */
function renderResources(resources) {
  // 根据资源数量优化布局
  const gridCols = resources.length === 1 ? 'grid-cols-1' : 
                   resources.length === 2 ? 'grid-cols-2' : 
                   'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
  
  return utils.createHtml`
    <div class="grid ${gridCols} gap-4 mt-6">
      ${resources.map(resource => utils.createHtml`
        <div class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer" onclick="showImage(this.querySelector('img'))">
          <img 
            src="${resource.externalLink || ''}" 
            alt="${resource.filename || '图片'}"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
            loading="lazy"
            data-preview="true"
          />
          <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 rounded-lg"></div>
        </div>
      `).join('')}
    </div>
  `;
}

// 路由处理 - 优化路由模块化
class Routes {
  /**
   * 主页路由处理
   * @param {Context} c - Hono上下文
   * @return {Response} HTTP响应
   */
  static async home(c) {
    try {
      const memos = await apiHandler.fetchMemos(c);
      
      // 将memos数据转换为HTML
      const memosHtml = memos.map(memo => renderMemo(memo, true)).join('');

      return new Response(renderBaseHtml(
        c.env.SITE_NAME, 
        memosHtml, 
        c.env.FOOTER_TEXT || CONFIG.APP.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=300' // 5分钟缓存
        }
      });
    } catch (error) {
      console.error('渲染首页失败:', error);
      return new Response(renderErrorPage(error, c), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        status: 500
      });
    }
  }
  
  /**
   * 单页路由处理
   * @param {Context} c - Hono上下文
   * @return {Response} HTTP响应
   */
  static async post(c) {
    try {
      const name = c.req.param('name');
      const data = await apiHandler.fetchMemo(c, name);
      
      // 未找到数据
      if (!data || !data.memo) {
        return new Response(renderBaseHtml(
          c.env.SITE_NAME, 
          htmlTemplates.notFoundPage(),
          c.env.FOOTER_TEXT || CONFIG.APP.FOOTER_TEXT,
          c.env.NAV_LINKS,
          c.env.SITE_NAME
        ), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' },
          status: 404
        });
      }

      const memoHtml = renderMemo(data.memo, false);

      return new Response(renderBaseHtml(
        c.env.SITE_NAME, 
        memoHtml, 
        c.env.FOOTER_TEXT || CONFIG.APP.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=1800' // 30分钟缓存
        }
      });
    } catch (error) {
      console.error('渲染文章页失败:', error);
      return new Response(renderErrorPage(error, c), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        status: 500
      });
    }
  }
  
  /**
   * 标签页路由处理
   * @param {Context} c - Hono上下文
   * @return {Response} HTTP响应
   */
  static async tag(c) {
    try {
      const tag = c.req.param('tag');
      const memos = await apiHandler.fetchMemos(c, tag);
      
      // 将memos数据转换为HTML
      const memosHtml = memos.map(memo => renderMemo(memo, true)).join('');

      return new Response(renderBaseHtml(
        `${tag} - ${c.env.SITE_NAME}`, 
        memosHtml, 
        c.env.FOOTER_TEXT || CONFIG.APP.FOOTER_TEXT,
        c.env.NAV_LINKS,
        c.env.SITE_NAME
      ), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=300' // 5分钟缓存
        }
      });
    } catch (error) {
      console.error('渲染标签页失败:', error);
      return new Response(renderErrorPage(error, c), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        status: 500
      });
    }
  }
  
  /**
   * API代理 - 用于缓存资源
   * @param {Context} c - Hono上下文
   * @return {Response} HTTP响应
   */
  static async api(c) {
    try {
      const memos = await apiHandler.fetchMemos(c);
      return new Response(JSON.stringify(memos), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=2592000' // 30天缓存
        }
      });
    } catch (error) {
      console.error('API代理失败:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      });
    }
  }
  
  /**
   * 服务工作线程路由
   * @param {Context} c - Hono上下文
   * @return {Response} HTTP响应
   */
  static async serviceWorker(c) {
    return new Response(
      c.env.ASSETS.fetch(new Request('/sw.js')), 
      {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
  
  /**
   * 离线页面路由
   * @param {Context} c - Hono上下文
   * @return {Response} HTTP响应
   */
  static offlinePage(c) {
    return new Response(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>离线 - ${c.env.SITE_NAME || '博客'}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
            color: #333;
            background-color: #f9fafb;
          }
          .container {
            max-width: 500px;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 16px;
            color: #1f2937;
          }
          p {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
            color: #4b5563;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 24px;
            color: #6b7280;
          }
          .btn {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #2563eb;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #111827;
              color: #e5e7eb;
            }
            h1 {
              color: #f9fafb;
            }
            p {
              color: #d1d5db;
            }
            .icon {
              color: #9ca3af;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📶</div>
          <h1>您当前处于离线状态</h1>
          <p>无法加载新内容。请检查您的网络连接并重试。</p>
          <a href="/" class="btn">刷新页面</a>
        </div>
      </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=2592000'
      }
    });
  }
  
  /**
   * 离线图片占位符
   * @return {Response} HTTP响应
   */
  static offlineImage() {
    // 提供简单的Base64编码的1x1像素透明PNG作为占位符
    const transparentPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    return new Response(Buffer.from(transparentPixel, 'base64'), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=2592000'
      }
    });
  }
}

// 统一路由错误处理
function renderErrorPage(error, c) {
  return renderBaseHtml(
    '错误', 
    htmlTemplates.errorPage(error),
    c.env.FOOTER_TEXT || CONFIG.APP.FOOTER_TEXT,
    c.env.NAV_LINKS,
    c.env.SITE_NAME
  );
}

// 注册路由 - 更简洁的路由处理
app.get('/', Routes.home);
app.get('/post/:name', Routes.post);
app.get('/tag/:tag', Routes.tag);
app.get('/api/v1/memo', Routes.api);

// Service Worker相关路由
app.get('/sw.js', Routes.serviceWorker);

// 离线页面
app.get('/offline.html', Routes.offlinePage);

// 离线图片占位符
app.get('/offline-image.png', Routes.offlineImage);

// 创建manifest.json文件路由
app.get('/manifest.json', (c) => {
  return new Response(JSON.stringify({
    name: c.env.SITE_NAME || 'Memos Themes',
    short_name: c.env.SITE_NAME || 'Memos',
    description: '记录生活点滴的轻量级博客',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: 'https://memos-themes.pages.dev/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'https://memos-themes.pages.dev/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=2592000'
    }
  });
});

// Service Worker实现
app.get('/sw.js', (c) => {
  const swScript = `
    const CACHE_NAME = 'memos-theme-cache-v1';
    const ASSETS_CACHE = 'memos-assets-cache-v1';
    const API_CACHE = 'memos-api-cache-v1';
    
    // 预缓存的资源
    const PRECACHE_ASSETS = [
      '/',
      '/offline.html',
      '/offline-image.png'
    ];
    
    // 安装事件 - 预缓存静态资源
    self.addEventListener('install', event => {
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => {
            console.log('预缓存静态资源');
            return cache.addAll(PRECACHE_ASSETS);
          })
          .then(() => self.skipWaiting())
      );
    });
    
    // 激活事件 - 清理旧缓存
    self.addEventListener('activate', event => {
      const currentCaches = [CACHE_NAME, ASSETS_CACHE, API_CACHE];
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
        }).then(cachesToDelete => {
          return Promise.all(cachesToDelete.map(cacheToDelete => {
            return caches.delete(cacheToDelete);
          }));
        }).then(() => self.clients.claim())
      );
    });
    
    // 响应策略 - 处理不同类型请求
    self.addEventListener('fetch', event => {
      const url = new URL(event.request.url);
      
      // 跳过不支持的请求
      if (event.request.method !== 'GET') return;
      
      // API请求处理 - 网络优先，失败时回退到缓存
      if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(event.request));
        return;
      }
      
      // 静态资源处理 - 缓存优先，失败时回退到网络
      if (
        url.pathname.endsWith('.js') || 
        url.pathname.endsWith('.css') || 
        url.pathname.endsWith('.png') || 
        url.pathname.endsWith('.jpg') || 
        url.pathname.endsWith('.svg') ||
        url.pathname.includes('cdn')
      ) {
        event.respondWith(handleAssetRequest(event.request));
        return;
      }
      
      // HTML请求处理 - 网络优先，失败时回退到缓存或离线页面
      event.respondWith(handlePageRequest(event.request));
    });
    
    // API请求处理
    async function handleApiRequest(request) {
      try {
        // 先尝试网络请求
        const networkResponse = await fetch(request);
        // 如果成功，更新缓存
        if (networkResponse.ok) {
          const cache = await caches.open(API_CACHE);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // 网络请求失败，尝试从缓存获取
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // 返回JSON错误
        return new Response(JSON.stringify({
          error: 'Network error. Using offline cached data.'
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        });
      }
    }
    
    // 静态资源请求处理
    async function handleAssetRequest(request) {
      // 先查询缓存
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 缓存未命中，从网络获取
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          // 成功获取后缓存
          const cache = await caches.open(ASSETS_CACHE);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // 对于图片，返回占位符
        if (request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return caches.match('/offline-image.png');
        }
        
        // 其他资源返回网络错误
        return new Response('Network error', { status: 503 });
      }
    }
    
    // 页面请求处理
    async function handlePageRequest(request) {
      try {
        // 尝试网络请求
        const networkResponse = await fetch(request);
        // 成功后更新缓存
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // 网络请求失败，尝试从缓存获取
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // 缓存也没有，返回离线页面
        return caches.match('/offline.html');
      }
    }
  `;
  
  return new Response(swScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache'
    }
  });
});

export default app 