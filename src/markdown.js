import { CONFIG } from './config.js';
import { utils } from './utils.js';

// Markdown渲染核心 - 使用缓存和高效处理
export const markdownRenderer = {
  // 处理缓存
  cache: new Map(),
  
  // 特殊链接域名列表
  specialDomains: [
    'youtube.com', 
    'bilibili.com', 
    'douyin.com', 
    'tiktok.com', 
    'music.163.com', 
    'github.com', 
    'mp.weixin.qq.com'
  ],
  
  // 主处理函数
  render(text) {
    if (!text) return '';
    
    // 检查缓存
    const cacheKey = text;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // 检测是否需要处理特殊链接
    const containsSpecialLinks = this.specialDomains.some(domain => text.includes(domain));
    
    // 处理流程
    const markdown = this.ensureMarkdown(text);
    const html = containsSpecialLinks
      ? this.renderToHtml(this.processSpecialLinks(markdown))
      : this.processSpecialLinks(this.renderToHtml(markdown));
    
    // 存入缓存
    this.cache.set(cacheKey, html);
    return html;
  },
  
  // 确保内容是Markdown格式
  ensureMarkdown(text) {
    // 识别文本是否已包含Markdown格式的标记
    const markdownMarkers = ['# ', '## ', '### ', '```', '*', '> '];
    const containsMarkdown = markdownMarkers.some(marker => text.includes(marker)) || 
                             /\[.*\]\(.*\)/.test(text);
    
    // 如果已经是Markdown格式，直接返回
    return containsMarkdown ? text : text;
  },
  
  // 将Markdown渲染为HTML - 高效实现
  renderToHtml(text) {
    // 使用字符串替换而非DOM操作，提高性能
    let html = text;
    const { MD } = CONFIG.REGEX;
    
    // 预处理文本，将连续的换行转换为段落分隔
    html = html.replace(/\n{2,}/g, '\n\n');
    
    // 应用Markdown转换 - 使用配置中的正则
    const transformations = [
      // 代码块（保留原始缩进）
      [MD.CODE_BLOCK, (match, lang, code) => 
        utils.createHtml`<pre data-language="${lang || 'plaintext'}" class="relative bg-gray-100 dark:bg-slate-800 rounded-[6px] my-4 p-4 overflow-auto"><code class="language-${lang || 'plaintext'}">${utils.escapeHtml(code)}</code></pre>`
      ],
      
      // 行内代码
      [MD.INLINE_CODE, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">$1</code>'],
      
      // 标题
      [MD.H1, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>'],
      [MD.H2, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>'],
      [MD.H3, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>'],
      
      // 引用
      [MD.QUOTE, '<blockquote class="pl-4 border-l-4 border-gray-300 dark:border-gray-600 my-4 text-gray-600 dark:text-gray-400">$1</blockquote>'],
      
      // 列表项
      [MD.LIST_ITEM, '<li class="ml-4 list-disc">$1</li>'],
      [MD.NUM_LIST, '<li class="ml-4 list-decimal">$2</li>'],
      
      // 格式化文本
      [MD.BOLD, '<strong>$1</strong>'],
      [MD.ITALIC, '<em>$1</em>'],
      
      // 处理图片 - 添加懒加载和预览支持
      [MD.IMAGE, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4" loading="lazy" data-preview="true" />'],
      
      // 处理标签
      [CONFIG.REGEX.TAG, (match, tag) => 
        `<a href="/tag/${tag}" class="${CONFIG.CSS.LINK}">#${tag}</a>`
      ],
      
      // 处理链接 - 排除微信链接（由特殊链接处理器处理）
      [MD.LINK, (match, text, url) => 
        `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">${text}</a>`
      ],
      
      // 处理普通URL - 避免处理已经在标签内的URL
      [/(^|[^"=])(https?:\/\/(?!mp\.weixin\.qq\.com)[^\s<]+[^<.,:;"')\]\s])/g, (match, prefix, url) => 
        `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">${url}</a>`
      ]
    ];
    
    // 应用所有转换
    transformations.forEach(([pattern, replacement]) => {
      html = html.replace(pattern, replacement);
    });
    
    // 包装列表
    html = html.replace(/(<li.*>.*<\/li>\n)+/g, match => {
      return match.includes('list-decimal') 
        ? `<ol class="my-4">${match}</ol>` 
        : `<ul class="my-4">${match}</ul>`;
    });
    
    // 处理段落
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(para => {
      // 如果段落已经包含块级元素标签或为空，不再包装
      if (para.trim() === '' || /^<(h[1-6]|pre|blockquote|ul|ol|div|p)/.test(para)) {
        return para;
      }
      // 替换段落内的单个换行为<br>
      return `<p class="text-gray-800 dark:text-gray-200 leading-relaxed">${para.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
    
    return html;
  },
  
  // 处理特殊链接 - 简化实现
  processSpecialLinks(html) {
    // 如果已处理过，直接返回
    if (html.includes('<iframe') || html.includes(`<div class="${CONFIG.CSS.EMBED_CONTAINER}">`)) {
      return html;
    }
    
    // 使用处理器映射表简化代码
    const linkProcessors = [
      // YouTube视频
      {
        regex: CONFIG.REGEX.MEDIA.YOUTUBE,
        process: (_, videoId) => this.createYouTubeEmbed(videoId)
      },
      
      // Bilibili视频
      {
        regex: CONFIG.REGEX.MEDIA.BILIBILI,
        process: (_, avid, bvid) => this.createBilibiliEmbed(avid || bvid)
      },
      
      // 网易云音乐
      {
        regex: CONFIG.REGEX.MEDIA.NETEASE,
        process: (_, songId) => this.createNeteaseEmbed(songId)
      },
      
      // GitHub仓库
      {
        regex: CONFIG.REGEX.LINKS.GITHUB,
        process: (_, repo) => this.createGithubCard(repo)
      },
      
      // 微信公众号文章
      {
        regex: CONFIG.REGEX.LINKS.WECHAT,
        process: url => this.createWechatCard(url)
      },
      
      // 微信Markdown链接
      {
        regex: CONFIG.REGEX.LINKS.WECHAT_MD,
        process: (_, title, url) => this.createWechatCard(url, title)
      }
    ];
    
    // 应用所有处理器
    return linkProcessors.reduce((result, { regex, process }) => {
      const processed = new Set();
      
      return result.replace(new RegExp(regex.source, 'g'), (match, ...args) => {
        // 生成唯一ID来标记这个匹配
        const markerId = match.slice(0, 20);
        
        // 避免重复处理和处理已在链接中的URL
        if (processed.has(markerId) || 
            new RegExp(`href=["']${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(result)) {
          return match;
        }
        
        processed.add(markerId);
        
        try {
          return process(match, ...args);
        } catch (error) {
          console.error('链接处理错误:', error);
          return match;
        }
      });
    }, html);
  },
  
  // 各种嵌入内容生成器 - 保持原有实现
  createYouTubeEmbed(videoId) {
    return utils.createHtml`
      <div class="${CONFIG.CSS.EMBED_CONTAINER}">
        <iframe 
          width="100%" 
          height="315" 
          src="https://www.youtube.com/embed/${videoId}" 
          title="YouTube video player" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen
          loading="lazy">
        </iframe>
      </div>
    `;
  },
  
  createBilibiliEmbed(id) {
    // 统一处理BV号和av号
    const vid = id.startsWith('BV') ? id : `aid=${id.replace('av', '')}`;
    return utils.createHtml`
      <div class="${CONFIG.CSS.EMBED_CONTAINER}">
        <iframe 
          width="100%" 
          height="315" 
          src="https://player.bilibili.com/player.html?${vid}&page=1" 
          scrolling="no" 
          border="0" 
          frameborder="no" 
          framespacing="0" 
          allowfullscreen="true"
          loading="lazy">
        </iframe>
      </div>
    `;
  },
  
  createNeteaseEmbed(songId) {
    return utils.createHtml`
      <div class="${CONFIG.CSS.EMBED_CONTAINER}">
        <iframe 
          frameborder="no" 
          border="0" 
          marginwidth="0" 
          marginheight="0" 
          width="100%" 
          height="86" 
          src="https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66"
          loading="lazy">
        </iframe>
      </div>
    `;
  },
  
  createGithubCard(repo) {
    return utils.createHtml`
      <div class="${CONFIG.CSS.EMBED_CONTAINER} p-4 flex flex-col">
        <a href="https://github.com/${repo}" target="_blank" rel="noopener noreferrer" class="flex items-center mb-2">
          <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span class="font-medium">${repo}</span>
        </a>
        <p class="text-sm text-gray-600 dark:text-gray-400">GitHub Repository</p>
      </div>
    `;
  },
  
  createWechatCard(url, title = '微信公众号文章') {
    return utils.createHtml`
      <div class="${CONFIG.CSS.EMBED_CONTAINER} p-4 flex flex-col">
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="flex items-center mb-2">
          <svg class="w-5 h-5 mr-2 text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.046-.857-2.578.157-4.972 2.344-6.635 2.183-1.663 5.1-2.046 7.57-1.054v-.014c0-4.054-3.89-7.342-8.69-7.342zm-1.493 3.93c.715 0 1.293.578 1.293 1.293s-.578 1.293-1.293 1.293a1.293 1.293 0 1 1 0-2.586zm6.863 2.586a1.293 1.293 0 0 1 0-2.586c.716 0 1.294.578 1.294 1.293s-.578 1.293-1.294 1.293z"/>
            <path d="M22.794 12.196c0-3.36-3.371-6.103-7.524-6.103-4.156 0-7.525 2.743-7.525 6.103 0 3.36 3.37 6.103 7.525 6.103.6 0 1.186-.073 1.74-.182.034-.007.062-.007.096-.007a.5.5 0 0 1 .263.074l1.335.795c.055.034.116.054.177.054a.3.3 0 0 0 .294-.295 1.98 1.98 0 0 0-.048-.212l-.278-1.037a.599.599 0 0 1 .207-.659c1.669-1.225 2.738-2.943 2.738-4.634zm-10.099 1.344a.882.882 0 0 1-.878-.88c0-.487.392-.879.878-.879.487 0 .879.392.879.88 0 .487-.392.879-.879.879zm5.15 0a.882.882 0 0 1-.878-.88c0-.487.392-.879.878-.879.487 0 .879.392.879.88 0 .487-.392.879-.879.879z"/>
          </svg>
          <span class="font-medium">${title}</span>
        </a>
        <p class="text-sm text-gray-600 dark:text-gray-400">微信公众号文章</p>
      </div>
    `;
  }
};

// 简化版Markdown渲染 - 用于短文本
export function simpleMarkdown(text) {
  if (!text) return '';
  return markdownRenderer.render(text);
} 