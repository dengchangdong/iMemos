import { CONFIG } from './config.js'

// 帮助函数 - 工具集
export const utils = {
  // HTML转义，防止XSS攻击
  escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },
  
  // 格式化时间
  formatTime(timestamp) {
    const now = new Date()
    const date = new Date(timestamp)
    const diff = now - date
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    // 1分钟以内
    if (minutes < 1) return '刚刚'
    
    // 1小时以内
    if (minutes < 60) return `${minutes} 分钟前`
    
    // 当天发布的且24小时以内
    if (hours < 24 && date.getDate() === now.getDate()) 
      return `${hours} 小时前`
    
    // 非当天发布但是是当年发布的
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\//g, '-')
    }
    
    // 非当年发布的
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  },
  
  // 创建HTML元素（用于模板）
  createHtml(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  }
}

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
    
    // 三步处理流程
    const markdown = this.ensureMarkdown(text);
    
    // 先处理特殊链接再渲染Markdown (如果包含特殊链接)
    let html;
    if (containsSpecialLinks) {
      // 先处理特殊链接，避免被Markdown渲染破坏
      const preProcessed = this.processSpecialLinks(markdown);
      // 再渲染Markdown
      html = this.renderToHtml(preProcessed);
    } else {
      // 正常渲染Markdown
      html = this.renderToHtml(markdown);
      // 再处理特殊链接
      html = this.processSpecialLinks(html);
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
    
    // 否则尝试将纯文本转换为简单的Markdown
    // 目前实现简单返回，未来可以添加自动格式化
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
      utils.createHtml`<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto my-4"><code class="language-${lang || 'plaintext'}">${utils.escapeHtml(code)}</code></pre>`
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
    
    return html;
  },
  
  // 处理特殊链接 - 高效精简实现
  processSpecialLinks(html) {
    // 对于已经处理过的HTML内容，直接返回，避免重复处理
    if (html.includes('<iframe') || html.includes('<div class="' + CONFIG.CSS.EMBED_CONTAINER + '">')) {
      return html;
    }
    
    const processLink = (regex, linkProcessor) => {
      html = html.replace(regex, (match, ...args) => {
        const processed = linkProcessor(...args);
        return processed ? `<div class="${CONFIG.CSS.EMBED_CONTAINER}">${processed}</div>` : match;
      });
    };
    
    const processMediaEmbed = (regex, createEmbedHTML) => {
      processLink(regex, (...args) => createEmbedHTML(...args));
    };
    
    // 处理各种媒体嵌入
    processMediaEmbed(CONFIG.REGEX.YOUTUBE, (videoId) => 
      `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    );
    
    processMediaEmbed(CONFIG.REGEX.BILIBILI, (avId, bvId) => {
      const id = avId || bvId;
      return `<iframe width="100%" height="315" src="https://player.bilibili.com/player.html?bvid=${id}" frameborder="0" allowfullscreen></iframe>`;
    });
    
    processMediaEmbed(CONFIG.REGEX.NETEASE, (songId) => 
      `<iframe width="100%" height="86" src="https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66" frameborder="0"></iframe>`
    );
    
    processMediaEmbed(CONFIG.REGEX.GITHUB, (repo) => 
      `<iframe width="100%" height="400" src="https://ghbtns.com/github-btn.html?user=${repo.split('/')[0]}&repo=${repo.split('/')[1]}&type=star&count=true" frameborder="0" scrolling="0"></iframe>`
    );
    
    processMediaEmbed(CONFIG.REGEX.DOUYIN, (videoId1, videoId2) => {
      const id = videoId1 || videoId2;
      return `<iframe width="100%" height="700" src="https://www.douyin.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    });
    
    processMediaEmbed(CONFIG.REGEX.TIKTOK, (videoId) => 
      `<iframe width="100%" height="700" src="https://www.tiktok.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    );
    
    // 处理微信文章
    processLink(CONFIG.REGEX.WECHAT, (url) => this.createWechatCard(url));
    processLink(CONFIG.REGEX.WECHAT_MD, (title, url) => this.createWechatCard(url, title));
    
    return html;
  },
  
  // 创建微信文章卡片
  createWechatCard(url, title = '微信公众号文章') {
    return `
      <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="flex items-center mb-2">
          <img src="https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.png" alt="微信" class="w-6 h-6 mr-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">微信公众号</span>
        </div>
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="block">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">${title}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">点击阅读全文</p>
        </a>
      </div>
    `;
  }
}

// 简单Markdown处理函数
export function simpleMarkdown(text) {
  if (!text) return '';
  return markdownRenderer.render(text);
} 