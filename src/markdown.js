import { CONFIG } from './config.js';
import { utils } from './utils.js';

// Markdown渲染核心 - 使用缓存和高效处理
export const markdownRenderer = {
  // 处理缓存
  cache: new Map(),
  
  // 主处理函数
  render(text) {
    if (!text) return '';
    
    // 检查缓存
    const cacheKey = text;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // 检测是否需要处理特殊链接
    const containsSpecialLinks = 
      text.includes('youtube.com') || 
      text.includes('bilibili.com') || 
      text.includes('douyin.com') || 
      text.includes('tiktok.com') || 
      text.includes('music.163.com') || 
      text.includes('github.com') || 
      text.includes('mp.weixin.qq.com');
    
    // 处理流程
    const markdown = this.ensureMarkdown(text);
    
    // 根据内容特点选择处理顺序
    let html;
    if (containsSpecialLinks) {
      // 先处理特殊链接，避免被Markdown渲染破坏
      const preProcessed = this.processSpecialLinks(markdown);
      // 再渲染Markdown
      html = this.renderToHtml(preProcessed);
    } else {
      // 正常渲染Markdown
      html = this.renderToHtml(markdown);
    }
    
    // 存入缓存
    this.cache.set(cacheKey, html);
    return html;
  },
  
  // 确保内容是Markdown格式
  ensureMarkdown(text) {
    // 识别文本是否已包含Markdown格式
    const containsMarkdown = 
      text.includes('# ') || 
      text.includes('## ') || 
      text.includes('### ') || 
      text.includes('```') || 
      text.includes('*') || 
      text.includes('> ') ||
      /\[.*\]\(.*\)/.test(text);
    
    // 如果已经是Markdown格式，直接返回
    if (containsMarkdown) {
      return text;
    }
    
    // 否则直接返回原文本
    return text;
  },
  
  // 将Markdown渲染为HTML - 高效实现
  renderToHtml(text) {
    // 使用字符串替换而非DOM操作，提高性能
    let html = text;
    
    // 预处理文本，将连续的换行转换为段落分隔
    html = html.replace(/\n{2,}/g, '\n\n');
    
    // 代码块（保留原始缩进）
    html = html.replace(CONFIG.REGEX.MD_CODE_BLOCK, (match, lang, code) => 
      utils.createHtml`<pre data-language="${lang || 'text'}" class="relative bg-gray-100 dark:bg-slate-800 rounded-[6px] my-4 p-4 overflow-auto"><code class="language-${lang || 'text'}">${utils.escapeHtml(code)}</code></pre>`
    );
    
    // 行内代码
    html = html.replace(CONFIG.REGEX.MD_INLINE_CODE, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">$1</code>');
    
    // 标题 
    html = html.replace(CONFIG.REGEX.MD_H1, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
    html = html.replace(CONFIG.REGEX.MD_H2, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');
    html = html.replace(CONFIG.REGEX.MD_H3, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    
    // 引用
    html = html.replace(CONFIG.REGEX.MD_QUOTE, '<blockquote class="pl-4 border-l-4 border-gray-300 dark:border-gray-600 my-4 text-gray-600 dark:text-gray-400">$1</blockquote>');
    
    // 列表项
    html = html.replace(CONFIG.REGEX.MD_LIST_ITEM, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(CONFIG.REGEX.MD_NUM_LIST, '<li class="ml-4 list-decimal">$2</li>');
    
    // 包装列表
    html = html.replace(/(<li.*>.*<\/li>\n)+/g, (match) => {
      if (match.includes('list-decimal')) {
        return `<ol class="my-4">${match}</ol>`;
      }
      return `<ul class="my-4">${match}</ul>`;
    });
    
    // 格式化文本
    html = html.replace(CONFIG.REGEX.MD_BOLD, '<strong>$1</strong>');
    html = html.replace(CONFIG.REGEX.MD_ITALIC, '<em>$1</em>');
    
    // 处理图片 - 添加懒加载和预览支持
    html = html.replace(CONFIG.REGEX.MD_IMAGE, 
      '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4" loading="lazy" data-preview="true" />'
    );
    
    // 处理链接 - 排除微信链接（由特殊链接处理器处理）
    html = html.replace(CONFIG.REGEX.MD_LINK, (match, text, url) => {
      // 保持URL原样，不对特殊字符进行转义
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">${text}</a>`;
    });
    
    // 处理标签
    html = html.replace(CONFIG.REGEX.TAG, (match, tag) => {
      return `<a href="/tag/${tag}" class="${CONFIG.CSS.LINK}">#${tag}</a>`;
    });
    
    // 处理普通URL - 避免处理已经在标签内的URL
    html = html.replace(/(^|[^"=])(https?:\/\/(?!mp\.weixin\.qq\.com)[^\s<]+[^<.,:;"')\]\s])/g, (match, prefix, url) => {
      return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">${url}</a>`;
    });
    
    // 正确处理段落，将单个换行符转换为<br>，将多个换行符转换为段落分隔
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(para => {
      // 如果段落已经包含块级元素标签，不再包装
      if (para.trim() === '' || /^<(h[1-6]|pre|blockquote|ul|ol|div|p)/.test(para)) {
        return para;
      }
      // 替换段落内的单个换行为<br>
      return `<p class="text-gray-800 dark:text-gray-200 leading-relaxed">${para.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
    
    // 处理特殊链接
    html = this.processSpecialLinks(html);
    
    return html;
  },
  
  // 处理特殊链接 - 高效精简实现
  processSpecialLinks(html) {
    // 对于已经处理过的HTML内容，直接返回，避免重复处理
    if (html.includes('<iframe') || html.includes('<div class="' + CONFIG.CSS.EMBED_CONTAINER + '">')) {
      return html;
    }
    
    // 创建通用的链接处理函数
    const processLink = (regex, processor) => {
      const processedMarker = {};
      
      html = html.replace(new RegExp(regex.source, 'g'), (match, ...args) => {
        // 生成唯一ID来标记这个匹配
        const markerId = match.slice(0, 20) + (args[0] || '');
        
        // 检查是否已处理过这个匹配或在a标签内
        if (processedMarker[markerId] || 
            new RegExp(`href=["']${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(html)) {
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
      
      return html;
    };
    
    // 处理微信公众号链接
    html = processLink(CONFIG.REGEX.WECHAT_MD, (match, title, url) => {
      return this.createWechatCard(url, title);
    });
    
    html = processLink(CONFIG.REGEX.WECHAT, (match) => {
      return this.createWechatCard(match);
    });
    
    // 处理视频和音频嵌入
    const embedHandlers = [
      {
        regex: CONFIG.REGEX.YOUTUBE,
        createEmbed: (match, videoId) => {
          if (!videoId) return match;
          const embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=0`;
          return this.createEmbedHTML(embedSrc, 'w-full aspect-video', 'frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen');
        }
      },
      {
        regex: CONFIG.REGEX.BILIBILI,
        createEmbed: (match, avid, bvid) => {
          const id = bvid || avid;
          if (!id) return match;
          const embedSrc = `https://player.bilibili.com/player.html?${bvid ? 'bvid=' + bvid : 'aid=' + avid.replace('av', '')}&high_quality=1`;
          return this.createEmbedHTML(embedSrc, 'w-full aspect-video');
        }
      },
      {
        regex: CONFIG.REGEX.DOUYIN,
        createEmbed: (match, vid1, vid2) => {
          const vid = vid1 || vid2;
          if (!vid) return match;
          const embedSrc = `https://www.douyin.com/video/${vid}`;
          return this.createEmbedHTML(embedSrc, 'w-full aspect-video douyin-container');
        }
      },
      {
        regex: CONFIG.REGEX.TIKTOK,
        createEmbed: (match, vid) => {
          if (!vid) return match;
          const embedSrc = `https://www.tiktok.com/embed/v2/${vid}`;
          return this.createEmbedHTML(embedSrc, 'w-full aspect-video');
        }
      },
      {
        regex: CONFIG.REGEX.NETEASE,
        createEmbed: (match, songId) => {
          if (!songId) return match;
          const embedSrc = `https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`;
          return this.createEmbedHTML(embedSrc, 'w-full h-24');
        }
      },
      {
        regex: CONFIG.REGEX.GITHUB,
        createEmbed: (match, repo) => {
          if (!repo) return match;
          return utils.createHtml`<div class="my-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center space-x-3">
            <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <a href="${match}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK} flex-1 truncate">
              ${repo}
            </a>
          </div>`;
        }
      }
    ];
    
    // 处理所有嵌入类型
    embedHandlers.forEach(handler => {
      html = processLink(handler.regex, handler.createEmbed);
    });
    
    return html;
  },
  
  // 创建嵌入HTML
  createEmbedHTML(embedSrc, containerClass = '', attributes = '') {
    const cssClass = containerClass ? `${CONFIG.CSS.EMBED_CONTAINER} ${containerClass}` : CONFIG.CSS.EMBED_CONTAINER;
    
    return utils.createHtml`<div class="${cssClass}">
      <iframe src="${embedSrc}" ${attributes} loading="lazy"></iframe>
    </div>`;
  },
  
  // 创建微信卡片
  createWechatCard(url, title = '微信公众号文章') {
    // URL编码，避免特殊字符问题
    url = url.replace(/[^a-zA-Z0-9-_.~]/g, match => {
      const code = match.charCodeAt(0);
      return '%' + (code < 16 ? '0' : '') + code.toString(16).toUpperCase();
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
};

// 简化版Markdown渲染，用于不需要缓存的场景
export function simpleMarkdown(text) {
  if (!text) return '';
  return markdownRenderer.render(text);
} 