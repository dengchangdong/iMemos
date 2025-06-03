import { Hono } from 'hono'
import { marked } from 'marked'
import { renderBaseHtml } from './template.js'

const app = new Hono()

// 常量配置 - 集中管理所有常量
const CONFIG = {
  DEFAULTS: {
    FOOTER_TEXT: '© 2024 Memos Themes. All rights reserved.',
    PAGE_LIMIT: 10,
    TIMEZONE: 'Asia/Shanghai'
  },
  HEADERS: {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  // 正则表达式预编译，提高性能
  REGEX: {
    MEDIA: {
      YOUTUBE: /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:[&?].+)?/,
      BILIBILI: /https?:\/\/(?:www\.)?bilibili\.com\/video\/(?:(av\d+)|(BV[a-zA-Z0-9]+))(?:[/?].+)?/,
      NETEASE: /https?:\/\/music\.163\.com\/(?:#\/)?song\?id=(\d+)(?:[&?].+)?/,
      DOUYIN: /https?:\/\/(?:www\.)?douyin\.com\/(?:video\/([0-9]+)|.*vid=([0-9]+))(?:[?#].+)?/,
      TIKTOK: /https?:\/\/(?:www\.)?tiktok\.com\/@[^\/]+\/video\/([0-9]+)(?:[?#].+)?/
    },
    LINKS: {
      GITHUB: /https?:\/\/github\.com\/([^\/\s]+\/[^\/\s]+)(?:\/)?(?:[#?].+)?/,
      WECHAT: /https?:\/\/mp\.weixin\.qq\.com\/[^\s<"']+/,
      WECHAT_MD: /\[([^\]]+)\]\((https?:\/\/mp\.weixin\.qq\.com\/[^)]+)\)/
    },
    MARKDOWN: {
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
      IMAGE: /!\[([^\]]*)\]\(([^)]+)\)/g
    },
    TAG: /#([a-zA-Z0-9_\u4e00-\u9fa5]+)/g
  },
  CSS: {
    CARD: 'bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden',
    PROSE: 'prose dark:prose-invert max-w-none',
    LINK: 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors',
    EMBED: 'my-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800'
  }
}

// 帮助函数 - 工具集
const utils = {
  // HTML转义，防止XSS攻击
  escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },
  
  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    try {
      const timeZone = CONFIG.DEFAULTS.TIMEZONE;
      const now = new Date();
      const date = new Date(timestamp);
      
      // 获取指定时区的当前时间和目标时间
      const nowLocal = new Date(now.toLocaleString('en-US', { timeZone }));
      const dateLocal = new Date(date.toLocaleString('en-US', { timeZone }));
      
      const diff = nowLocal - dateLocal;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const sameDay = dateLocal.getDate() === nowLocal.getDate();
      const sameYear = dateLocal.getFullYear() === nowLocal.getFullYear();
      
      // 根据时间差返回不同格式
      if (minutes < 1) return '刚刚';
      if (minutes < 60) return `${minutes} 分钟前`;
      if (hours < 24 && sameDay) return `${hours} 小时前`;
      
      // 非当天但是当年
      if (sameYear) {
        return dateLocal.toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone
        }).replace(/\//g, '-');
      }
      
      // 非当年
      return dateLocal.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone
      }).replace(/\//g, '-');
    } catch (error) {
      console.error('时间格式化错误:', error);
      return new Date(timestamp).toLocaleString('zh-CN');
    }
  },
  
  // 创建HTML元素（用于模板）- 使用标签模板字符串
  createHtml(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  }
}

// Markdown渲染核心 - 使用缓存和高效处理
const markdownRenderer = {
  // 处理缓存 - 使用Map以获得更好的性能
  cache: new Map(),
  
  // 主处理函数
  render(text) {
    if (!text) return '';
    
    // 检查缓存
    const cacheKey = text;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      // 快速检测是否包含特殊链接
      const hasSpecialLinks = 
        /youtube\.com|bilibili\.com|douyin\.com|tiktok\.com|music\.163\.com|github\.com|mp\.weixin\.qq\.com/i.test(text);
      
      // 1. 确保文本是Markdown格式
      const markdown = this.ensureMarkdown(text);
      
      // 2. 处理Markdown
      let html;
      if (hasSpecialLinks) {
        // 先处理特殊链接再渲染Markdown
        const preProcessed = this.processSpecialLinks(markdown);
        html = marked(preProcessed);
      } else {
        // 直接渲染Markdown
        html = marked(markdown);
      }
      
      // 3. 存入缓存
      this.cache.set(cacheKey, html);
      return html;
    } catch (error) {
      console.error('Markdown渲染错误:', error);
      return `<p class="text-red-500">内容渲染失败</p>`;
    }
  },
  
  // 确保内容是Markdown格式
  ensureMarkdown(text) {
    if (!text) return '';
    
    // 检测文本是否已包含Markdown格式
    const hasMarkdown = /^#|\n#|```|\*\*|\*[^*]|\[.*\]\(.*\)|^>|^-\s|^\d+\.\s/m.test(text);
    
    // 如果已经是Markdown格式，直接返回
    if (hasMarkdown) return text;
    
    // 简单处理纯文本 - 保留换行符
    return text.replace(/\n/g, '  \n');
  },
  
  // 处理特殊链接 - 高效精简实现
  processSpecialLinks(html) {
    // 对于已经处理过的HTML内容，直接返回，避免重复处理
    if (html.includes('<iframe') || html.includes('<div class="' + CONFIG.CSS.EMBED + '">')) {
      return html;
    }
    
    // 统一的链接处理函数 - 添加标记以防止重复处理
    const processLink = (regex, linkProcessor) => {
      // 在处理前添加一个标记，防止重复处理同一链接
      const processedMarker = {};
      
      html = html.replace(new RegExp(regex.source, 'g'), (match, ...args) => {
        // 生成唯一ID来标记这个匹配
        const markerId = match.slice(0, 20) + (args[0] || '');
        
        // 检查是否已处理过这个匹配
        if (processedMarker[markerId]) {
          return match;
        }
        
        // 检查链接是否已在a标签内
        if (new RegExp(`href=["']${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(html)) {
          return match;
        }
        
        // 标记为已处理
        processedMarker[markerId] = true;
        
        try {
          return linkProcessor(match, ...args);
        } catch (error) {
          console.error('链接处理错误:', error, match, args);
          return match;
        }
      });
      return html;
    };
    
    // 媒体嵌入处理函数 - 添加标记以防止重复处理
    const processMediaEmbed = (regex, createEmbedHTML) => {
      // 在处理前添加一个标记，防止重复处理同一链接
      const processedMarker = {};
      
      html = html.replace(new RegExp(regex.source, 'g'), (match, ...args) => {
        // 生成唯一ID来标记这个匹配
        const markerId = match.slice(0, 20) + (args[0] || '');
        
        // 检查是否已处理过这个匹配
        if (processedMarker[markerId]) {
          return match;
        }
        
        // 标记为已处理
        processedMarker[markerId] = true;
        
        try {
          // 取出正则表达式捕获的值用于生成嵌入源
          const embedSrc = typeof createEmbedHTML.embedSrc === 'function' 
            ? createEmbedHTML.embedSrc(match, ...args) 
            : '';
          
          // 检查是否已经嵌入
          if (html.includes(`src="${embedSrc}"`) || 
              html.includes(`src="${embedSrc.replace('http:', '')}"`)) {
            return match;
          }
          
          // 确保有有效的嵌入源
          if (!embedSrc) {
            console.error('无法生成嵌入源:', match, args);
            return match;
          }
          
          // 抖音视频需要特殊的容器样式
          const isDouyin = embedSrc.includes('open.douyin.com');
          const containerClass = isDouyin 
            ? `${CONFIG.CSS.EMBED} douyin-container` 
            : CONFIG.CSS.EMBED;
          
          return utils.createHtml`<div class="${containerClass}">
            <iframe src="${embedSrc}" 
                    ${createEmbedHTML.attributes || ''}
                    loading="lazy"></iframe>
          </div>`;
        } catch (error) {
          console.error('嵌入处理错误:', error, match, args);
          return match;
        }
      });
      
      return html;
    };
    
    // 微信公众号链接处理（Markdown格式）
    html = processLink(CONFIG.REGEX.LINKS.WECHAT_MD, (match, title, url) => {
      return this.createWechatCard(url, title);
    });
    
    // 处理非Markdown格式的微信公众号链接
    html = processLink(CONFIG.REGEX.LINKS.WECHAT, (match) => {
      return this.createWechatCard(match, '微信公众号文章');
    });
    
    // 处理YouTube视频
    html = processMediaEmbed(CONFIG.REGEX.MEDIA.YOUTUBE, {
      embedSrc: function(match, videoId) {
        // 确保videoId有效
        if (!videoId || typeof videoId !== 'string') {
          console.error('无效的YouTube视频ID:', videoId);
          return '';
        }
        return `https://www.youtube.com/embed/${videoId}?autoplay=0`;
      },
      attributes: 'class="w-full aspect-video" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen'
    });
    
    // 处理Bilibili视频
    html = processMediaEmbed(CONFIG.REGEX.MEDIA.BILIBILI, {
      embedSrc: function(match, avid, bvid) {
        // 优先使用BV号
        if (bvid && typeof bvid === 'string') {
          return `https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1&danmaku=0&autoplay=0`;
        } 
        // 然后尝试使用av号
        else if (avid && typeof avid === 'string') {
          // 移除'av'前缀(如果有的话)
          const aid = avid.startsWith('av') ? avid.slice(2) : avid;
          return `https://player.bilibili.com/player.html?aid=${aid}&high_quality=1&danmaku=0&autoplay=0`;
        } 
        else {
          console.error('无法识别的Bilibili视频链接:', match);
          return '';
        }
      },
      attributes: 'class="w-full aspect-video" scrolling="no" frameborder="no" allowfullscreen sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts allow-popups" referrerpolicy="no-referrer"'
    });
    
    // 处理抖音视频
    html = processMediaEmbed(CONFIG.REGEX.MEDIA.DOUYIN, {
      embedSrc: function(match, videoId, vidParam) {
        // 使用视频ID或vid参数
        const finalVideoId = videoId || vidParam;
        if (!finalVideoId || typeof finalVideoId !== 'string') {
          console.error('无效的抖音视频ID:', match);
          return '';
        }
        return `https://open.douyin.com/player/video?vid=${finalVideoId}&autoplay=0`;
      },
      attributes: 'style="aspect-ratio: .4821; width: min(324px, 100%); margin: auto;" scrolling="no" frameborder="no" allowfullscreen referrerpolicy="unsafe-url"'
    });
    
    // 处理TikTok视频
    html = processMediaEmbed(CONFIG.REGEX.MEDIA.TIKTOK, {
      embedSrc: function(match, videoId) {
        if (!videoId || typeof videoId !== 'string') {
          return '';
        }
        return `https://www.tiktok.com/embed/v2/${videoId}?autoplay=0`;
      },
      attributes: 'class="w-full aspect-video" scrolling="no" frameborder="no" allowfullscreen'
    });
    
    // 处理网易云音乐
    html = processMediaEmbed(CONFIG.REGEX.MEDIA.NETEASE, {
      embedSrc: function(match, songId) {
        if (!songId || typeof songId !== 'string') {
          return '';
        }
        return `//music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`;
      },
      attributes: 'class="w-full h-[86px]" frameborder="no" border="0" marginwidth="0" marginheight="0"'
    });
    
    // 处理GitHub仓库
    html = processLink(CONFIG.REGEX.LINKS.GITHUB, (match, repo) => {
      return utils.createHtml`<div class="my-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center space-x-3">
        <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <a href="${match}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">
          ${repo}
        </a>
      </div>`;
    });
    
    return html;
  },
  
  // 创建微信公众号卡片
  createWechatCard(url, title = '微信公众号文章') {
    if (!url || typeof url !== 'string') {
      console.error('无效的微信公众号URL:', url);
      return '';
    }
    
    // 确保URL是安全的，但不进行HTML实体编码
    // 仅过滤掉可能导致XSS的尖括号和引号
    url = url.replace(/[<>"']/g, match => {
      switch (match) {
        case '<': return '%3C';
        case '>': return '%3E';
        case '"': return '%22';
        case "'": return '%27';
        default: return match;
      }
    });
    
    title = title.replace(/[<>"']/g, '');
    
    return utils.createHtml`<div class="my-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center space-x-3">
      <svg class="w-6 h-6 text-green-600 dark:text-green-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.328.328 0 00.166-.054l1.9-1.106a.598.598 0 01.504-.042 10.284 10.284 0 003.055.462c.079 0 .158-.001.237-.003a3.57 3.57 0 00-.213-1.88 7.354 7.354 0 01-4.53-6.924c0-3.195 2.738-5.766 6.278-5.951h.043l.084-.001c.079 0 .158 0 .237.003 3.738.186 6.705 2.875 6.705 6.277 0 3.073-2.81 5.597-6.368 5.806a.596.596 0 00-.212.043c-.09.019-.166.07-.237.117h-.036c-.213 0-.416-.036-.618-.073l-.6-.083a.71.71 0 00-.213-.035 1.897 1.897 0 00-.59.095l-1.208.581a.422.422 0 01-.16.036c-.164 0-.295-.13-.295-.295 0-.059.019-.118.037-.165l.075-.188.371-.943c.055-.14.055-.295-.018-.413a3.68 3.68 0 01-.96-1.823c-.13-.414-.206-.846-.213-1.278a3.75 3.75 0 01.891-2.431c-.002 0-.002-.001-.003-.004a5.7 5.7 0 01-.493.046c-.055.003-.11.004-.165.004-4.801 0-8.691-3.288-8.691-7.345 0-4.056 3.89-7.346 8.691-7.346M18.3 15.342a.496.496 0 01.496.496.509.509 0 01-.496.496.509.509 0 01-.497-.496.497.497 0 01.497-.496m-4.954 0a.496.496 0 01.496.496.509.509 0 01-.496.496.509.509 0 01-.497-.496.497.497 0 01.497-.496M23.999 17.33c0-3.15-3.043-5.73-6.786-5.943a7.391 7.391 0 00-.283-.004c-3.849 0-7.067 2.721-7.067 6.23 0 3.459 3.055 6.175 6.848 6.227.059.001.118.003.177.003a8.302 8.302 0 002.484-.377.51.51 0 01.426.035l1.59.93c.06.036.118.048.177.048.142 0 .26-.118.26-.26 0-.07-.018-.13-.048-.189l-.331-1.243a.515.515 0 01.178-.555c1.563-1.091 2.575-2.765 2.575-4.902"/>
      </svg>
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK} flex-1 truncate">
        ${title}
      </a>
    </div>`;
  }
}

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
    return renderErrorPage(err, c)
  }
})

// 渲染单个 memo
function renderMemo(memo, isHomePage = false) {
  try {
    // 处理时间戳
    const timestamp = memo.createTime 
      ? new Date(memo.createTime).getTime()
      : memo.createdTs * 1000;
    const date = utils.formatTime(timestamp);
    
    // 使用缓存的Markdown渲染器处理内容
    const content = simpleMarkdown(memo.content || '');
    
    // 处理资源列表
    const resources = memo.resources || memo.resourceList || [];
    const hasResources = resources.length > 0;
    
    // 根据资源数量确定布局样式
    const resourcesHTML = hasResources ? utils.createHtml`
      <div class="grid ${resources.length === 1 ? 'grid-cols-1' : resources.length === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'} gap-4 mt-6">
        ${resources.map(resource => utils.createHtml`
          <div class="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-zoom-in" onclick="showImageModal('${resource.externalLink || ''}')">
            <img 
              src="${resource.externalLink || ''}" 
              alt="${resource.filename || '图片'}"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
              loading="lazy"
            />
          </div>
        `).join('')}
      </div>
    ` : '';
    
    // 生成时间链接HTML
    const timeHTML = isHomePage 
      ? utils.createHtml`<a href="/post/${memo.name}" class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">${date}</a>`
      : utils.createHtml`<time class="text-sm text-gray-500 dark:text-gray-400">${date}</time>`;
    
    // 组合最终HTML
    return utils.createHtml`
      <article class="${CONFIG.CSS.CARD} mb-8">
        <div class="p-6">
          ${timeHTML}
          <div class="mt-4 ${CONFIG.CSS.PROSE}">${content}</div>
          ${resourcesHTML}
        </div>
      </article>
    `;
  } catch (error) {
    console.error('渲染 memo 失败:', error);
    return utils.createHtml`
      <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        <p class="font-medium">渲染失败</p>
        <p class="text-sm mt-1">${error.message || '未知错误'}</p>
      </div>
    `;
  }
}

// 优化HTML模板渲染 - 共享常量避免重复
const htmlTemplates = {
  // 错误页面模板
  errorPage(error) {
    return utils.createHtml`
      <div class="max-w-2xl mx-auto">
        <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg shadow-sm">
          <h2 class="text-lg font-semibold mb-2">加载失败</h2>
          <p class="text-sm">${error.message || '发生未知错误'}</p>
          <a href="/" class="inline-flex items-center mt-4 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            返回首页
          </a>
        </div>
      </div>
    `;
  },
  
  // 404页面模板
  notFoundPage() {
    return utils.createHtml`
      <div class="max-w-2xl mx-auto text-center py-12">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">未找到内容</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">您访问的内容不存在或已被删除</p>
        <a href="/" class="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          返回首页
        </a>
      </div>
    `;
  },
  
  // 空数据提示
  emptyDataPage(message = '暂无数据') {
    return utils.createHtml`
      <div class="text-center py-16">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
        </svg>
        <p class="text-xl text-gray-500 dark:text-gray-400">${message}</p>
      </div>
    `;
  }
};

// 统一错误页面渲染函数
function renderErrorPage(error, c) {
  console.error('错误:', error);
  return c.html(
    renderBaseHtml(
      c,
      '错误', 
      htmlTemplates.errorPage(error)
    )
  );
}

// 导出应用
export default app;