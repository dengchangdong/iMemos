import { CONFIG } from './config.js';
import { utils } from './utils.js';

// Markdown 渲染器类
class MarkdownRenderer {
  constructor() {
    this.cache = new Map();
    this.specialLinkPatterns = [
      'youtube.com',
      'bilibili.com',
      'douyin.com',
      'tiktok.com',
      'music.163.com',
      'github.com',
      'mp.weixin.qq.com'
    ];
  }

  // 主渲染函数
  render(text) {
    if (!text) return '';
    
    const cacheKey = text;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const containsSpecialLinks = this.specialLinkPatterns.some(pattern => text.includes(pattern));
    const markdown = this.ensureMarkdown(text);
    
    const html = containsSpecialLinks
      ? this.renderToHtml(this.processSpecialLinks(markdown))
      : this.renderToHtml(markdown);
    
    this.cache.set(cacheKey, html);
    return html;
  }
  
  // 确保内容是 Markdown 格式
  ensureMarkdown(text) {
    const markdownPatterns = [
      '# ',
      '## ',
      '### ',
      '```',
      '*',
      '> ',
      /\[.*\]\(.*\)/
    ];
    
    return markdownPatterns.some(pattern => 
      typeof pattern === 'string' 
        ? text.includes(pattern)
        : pattern.test(text)
    ) ? text : text;
  }
  
  // 渲染 Markdown 为 HTML
  renderToHtml(text) {
    let html = text.replace(/\n{2,}/g, '\n\n');
    
    // 代码块处理
    html = html.replace(CONFIG.REGEX.MARKDOWN.CODE_BLOCK, (match, lang, code) => 
      utils.createHtml`<pre data-language="${lang || 'plaintext'}" class="relative bg-gray-100 dark:bg-slate-800 rounded-[6px] my-4 p-4 overflow-auto"><code class="language-${lang || 'plaintext'}">${utils.escapeHtml(code)}</code></pre>`
    );
    
    // 行内代码
    html = html.replace(CONFIG.REGEX.MARKDOWN.INLINE_CODE, 
      '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">$1</code>'
    );
    
    // 标题处理
    const headerReplacements = {
      [CONFIG.REGEX.MARKDOWN.HEADERS.H1]: '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>',
      [CONFIG.REGEX.MARKDOWN.HEADERS.H2]: '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>',
      [CONFIG.REGEX.MARKDOWN.HEADERS.H3]: '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>'
    };
    
    Object.entries(headerReplacements).forEach(([regex, replacement]) => {
      html = html.replace(regex, replacement);
    });
    
    // 引用
    html = html.replace(CONFIG.REGEX.MARKDOWN.QUOTE, 
      '<blockquote class="pl-4 border-l-4 border-gray-300 dark:border-gray-600 my-4 text-gray-600 dark:text-gray-400">$1</blockquote>'
    );
    
    // 列表处理
    html = html.replace(CONFIG.REGEX.MARKDOWN.LISTS.UNORDERED, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(CONFIG.REGEX.MARKDOWN.LISTS.ORDERED, '<li class="ml-4 list-decimal">$2</li>');
    
    // 包装列表
    html = html.replace(/(<li.*>.*<\/li>\n)+/g, match => 
      match.includes('list-decimal') 
        ? `<ol class="my-4">${match}</ol>`
        : `<ul class="my-4">${match}</ul>`
    );
    
    // 文本格式化
    html = html.replace(CONFIG.REGEX.MARKDOWN.TEXT.BOLD, '<strong>$1</strong>');
    html = html.replace(CONFIG.REGEX.MARKDOWN.TEXT.ITALIC, '<em>$1</em>');
    
    // 图片处理
    html = html.replace(CONFIG.REGEX.MARKDOWN.LINKS.IMAGE, 
      '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4" loading="lazy" data-preview="true" />'
    );
    
    // 链接处理
    html = html.replace(CONFIG.REGEX.MARKDOWN.LINKS.NORMAL, (match, text, url) => 
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">${text}</a>`
    );
    
    // 标签处理
    html = html.replace(CONFIG.REGEX.TAG, (match, tag) => 
      `<a href="/tag/${tag}" class="${CONFIG.CSS.LINK}">#${tag}</a>`
    );
    
    // URL 处理
    html = html.replace(/(^|[^"=])(https?:\/\/(?!mp\.weixin\.qq\.com)[^\s<]+[^<.,:;"')\]\s])/g, 
      (match, prefix, url) => 
        `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">${url}</a>`
    );
    
    // 段落处理
    html = html.split('\n\n').map(para => {
      if (para.trim() === '' || /^<(h[1-6]|pre|blockquote|ul|ol|div|p)/.test(para)) {
        return para;
      }
      return `<p class="text-gray-800 dark:text-gray-200 leading-relaxed">${para.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
    
    return html;
  }
  
  // 处理特殊链接
  processSpecialLinks(html) {
    if (html.includes('<iframe') || html.includes(`<div class="${CONFIG.CSS.EMBED_CONTAINER}">`)) {
      return html;
    }
    
    const processLink = (regex, processor) => {
      const processedMarker = {};
      
      return html.replace(new RegExp(regex.source, 'g'), (match, ...args) => {
        const markerId = match.slice(0, 20) + (args[0] || '');
        
        if (processedMarker[markerId] || 
            new RegExp(`href=["']${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(html)) {
          return match;
        }
        
        processedMarker[markerId] = true;
        
        try {
          return processor(match, ...args);
        } catch (error) {
          console.error('链接处理错误:', error, match, args);
          return match;
        }
      });
    };
    
    // 处理微信公众号
    html = processLink(CONFIG.REGEX.SOCIAL.WECHAT_MD, (match, title, url) => 
      this.createWechatCard(url, title)
    );
    
    html = processLink(CONFIG.REGEX.SOCIAL.WECHAT, match => 
      this.createWechatCard(match)
    );
    
    // 处理嵌入内容
    const embedHandlers = [
      {
        regex: CONFIG.REGEX.VIDEO.YOUTUBE,
        createEmbed: (match, videoId) => {
          if (!videoId) return match;
          return this.createEmbedHTML(
            `https://www.youtube.com/embed/${videoId}?autoplay=0`,
            'w-full aspect-video',
            'frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen'
          );
        }
      },
      {
        regex: CONFIG.REGEX.VIDEO.BILIBILI,
        createEmbed: (match, avid, bvid) => {
          const id = bvid || avid;
          if (!id) return match;
          return this.createEmbedHTML(
            `https://player.bilibili.com/player.html?${bvid ? 'bvid=' + bvid : 'aid=' + avid.replace('av', '')}&high_quality=1`,
            'w-full aspect-video'
          );
        }
      },
      {
        regex: CONFIG.REGEX.VIDEO.DOUYIN,
        createEmbed: (match, vid1, vid2) => {
          const vid = vid1 || vid2;
          if (!vid) return match;
          return this.createEmbedHTML(
            `https://www.douyin.com/video/${vid}`,
            'w-full aspect-video douyin-container'
          );
        }
      },
      {
        regex: CONFIG.REGEX.VIDEO.TIKTOK,
        createEmbed: (match, vid) => {
          if (!vid) return match;
          return this.createEmbedHTML(
            `https://www.tiktok.com/embed/v2/${vid}`,
            'w-full aspect-video'
          );
        }
      },
      {
        regex: CONFIG.REGEX.MUSIC.NETEASE,
        createEmbed: (match, songId) => {
          if (!songId) return match;
          return this.createEmbedHTML(
            `https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`,
            'w-full h-24'
          );
        }
      },
      {
        regex: CONFIG.REGEX.SOCIAL.GITHUB,
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
    
    embedHandlers.forEach(({ regex, createEmbed }) => {
      html = processLink(regex, createEmbed);
    });
    
    return html;
  }
  
  // 创建嵌入 HTML
  createEmbedHTML(embedSrc, containerClass = '', attributes = '') {
    return utils.createHtml`<div class="${CONFIG.CSS.EMBED_CONTAINER}">
      <iframe src="${embedSrc}" class="${containerClass}" ${attributes}></iframe>
    </div>`;
  }
  
  // 创建微信公众号卡片
  createWechatCard(url, title = '微信公众号文章') {
    return utils.createHtml`<div class="${CONFIG.CSS.EMBED_CONTAINER} p-4">
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="flex items-center space-x-3">
        <svg class="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.328.328 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .718-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.856-.589-1.458-1.442-1.458-2.414 0-1.65 1.834-2.988 4.095-2.988.497 0 .966.093 1.397.258.13-.405.2-.837.2-1.29 0-2.33-2.5-4.218-5.582-4.218zM5.786 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.624 7.17c0-.651.52-1.18 1.162-1.18zm6.374 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm6.374 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm-12.748 8.82c-2.665 0-4.825 1.968-4.825 4.395 0 2.427 2.16 4.395 4.825 4.395.852 0 1.64-.209 2.338-.565a.59.59 0 0 1 .614.097l1.474 1.274a.292.292 0 0 0 .167.054c.133 0 .24-.11.24-.244 0-.063-.02-.125-.048-.177l-.334-.59a.59.59 0 0 1-.048-.213.59.59 0 0 1 .213-.442 6.322 6.322 0 0 0 1.64-2.213 5.31 5.31 0 0 1-1.64.258zm1.162-3.533c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm6.374 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18z"/>
        </svg>
        <span class="flex-1 truncate">${title}</span>
      </a>
    </div>`;
  }
}

// 导出单例实例
export const markdownRenderer = new MarkdownRenderer();

// 简单 Markdown 渲染函数
export function simpleMarkdown(text) {
  return markdownRenderer.render(text);
} 