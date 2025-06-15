import { CONFIG } from './config.js';
import { utils } from './utils.js';

// Markdown渲染核心 - 使用缓存和高效处理
export const markdownRenderer = {
  // 缓存，存储已渲染的Markdown文本对应的HTML
  cache: new Map(),

  /**
   * 主渲染函数。将Markdown文本转换为HTML，并进行缓存。
   * @param {string} text - 待渲染的Markdown文本。
   * @returns {string} 渲染后的HTML字符串。
   */
  render(text) {
    if (!text) return '';

    const cacheKey = text;
    // 1. 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 2. 将Markdown基础语法渲染为HTML
    let html = this._renderMarkdownToBasicHtml(text);

    // 3. 处理HTML中的特殊链接和嵌入内容（如视频、音频、卡片等）
    // 这一步在基础HTML渲染之后进行，确保处理的是已转换为HTML的链接
    html = this._processEmbedsAndSpecialLinks(html);

    // 4. 存入缓存
    this.cache.set(cacheKey, html);
    return html;
  },

  /**
   * 将Markdown基础语法转换为HTML。
   * 此函数主要处理标题、列表、代码块、引用、图片、普通链接等。
   * @param {string} text - 待处理的Markdown文本。
   * @returns {string} 包含基础HTML元素的字符串。
   * @private
   */
  _renderMarkdownToBasicHtml(text) {
    let html = text;

    // 统一换行符，并使用临时标记符处理段落分隔
    html = html.replace(/\r?\n/g, '\n'); // Normalize newlines (CRLF to LF)
    html = html.replace(/\n{2,}/g, 'PARAGRAPH_BREAK'); // Use a temporary marker for paragraphs

    // --- 块级元素处理 (顺序很重要：先处理大块，再处理小块或行内) ---

    // 代码块 (```lang\ncode\n```)
    html = html.replace(CONFIG.REGEX.MD_CODE_BLOCK, (match, lang, code) => {
      // 仅转义HTML实体，保留原始空格和换行，以便 `<pre><code>` 样式正确显示
      const escapedCodeContent = code
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, ''');

      // 使用 `utils.createHtml` 构建带Tailwind样式的代码块HTML结构
      return utils.createHtml`<div class="relative bg-gray-100 dark:bg-slate-800 rounded-md my-4" data-language="${lang || 'text'}" data-original-code="${encodeURIComponent(code)}">
        <div class="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <span class="text-sm text-gray-500 dark:text-gray-400">${lang || 'text'}</span>
          <button class="relative p-1.5 text-base text-gray-600 dark:text-gray-300 bg-transparent border-none rounded cursor-pointer opacity-100 transition-all duration-200 z-5 flex items-center justify-center w-7 h-7 hover:bg-black/5 dark:hover:bg-white/5" aria-label="复制代码" type="button">
            <i class="ri-file-copy-line"></i>
          </button>
        </div>
        <pre class="p-4 overflow-auto"><code class="language-${lang || 'text'}">${escapedCodeContent}</code></pre>
      </div>`;
    });

    // 引用 (>)
    html = html.replace(CONFIG.REGEX.MD_QUOTE, '<blockquote class="pl-4 border-l-4 border-gray-300 dark:border-gray-600 my-4 text-gray-600 dark:text-gray-400">$1</blockquote>');

    // 标题 (H3 -> H2 -> H1，避免H1匹配到H2或H3内容)
    html = html.replace(CONFIG.REGEX.MD_H3, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    html = html.replace(CONFIG.REGEX.MD_H2, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');
    html = html.replace(CONFIG.REGEX.MD_H1, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');

    // 列表项 (* or - for unordered, 1. for ordered)
    // 先匹配单个列表项
    html = html.replace(CONFIG.REGEX.MD_LIST_ITEM, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(CONFIG.REGEX.MD_NUM_LIST, '<li class="ml-4 list-decimal">$2</li>');

    // 包装列表 (将连续的`<li>`项包装到`<ul>`或`<ol>`中)
    // `gs` flags: `g` for global, `s` for dotall (makes `.` match newlines)
    html = html.replace(/(<li.*?<\/li>(\n|$))+/gs, (match) => {
      if (match.includes('list-decimal')) {
        return `<ol class="my-4">${match}</ol>`;
      }
      return `<ul class="my-4">${match}</ul>`;
    });

    // --- 行内元素处理 ---

    // 行内代码 (`)
    html = html.replace(CONFIG.REGEX.MD_INLINE_CODE, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">$1</code>');

    // 粗体 (**)
    html = html.replace(CONFIG.REGEX.MD_BOLD, '<strong>$1</strong>');
    // 斜体 (*)
    html = html.replace(CONFIG.REGEX.MD_ITALIC, '<em>$1</em>');

    // 图片 (![alt](url)) - 添加懒加载和预览支持
    html = html.replace(CONFIG.REGEX.MD_IMAGE,
      '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4" loading="lazy" data-preview="true" />'
    );

    // 链接 ([text](url)) - 排除微信链接，由特殊处理器处理
    html = html.replace(CONFIG.REGEX.MD_LINK, (match, text, url) => {
      // 如果是微信公众号链接，则跳过此正则处理，留给特殊链接处理器
      if (url.includes('mp.weixin.qq.com')) {
        return match;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">${text}</a>`;
    });

    // 标签 (#tag)
    html = html.replace(CONFIG.REGEX.TAG, (match, tag) => {
      return `<a href="/tag/${tag}" class="${CONFIG.CSS.LINK}">#${tag}</a>`;
    });

    // 普通URL (自动识别非Markdown链接的URL) - 避免处理已经在a标签内的URL，也排除微信链接
    html = html.replace(/(^|[^"=])(https?:\/\/(?!mp\.weixin\.qq\.com)[^\s<]+[^<.,:;"')\]\s])/g, (match, prefix, url) => {
      // 确保URL不是HTML属性值的一部分 (e.g., href="...")
      if (prefix.endsWith('=')) return match;
      return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">${url}</a>`;
    });

    // --- 段落处理 ---
    // 将通过`PARAGRAPH_BREAK`标记分隔的块转换为HTML段落
    const blocks = html.split('PARAGRAPH_BREAK');
    html = blocks.map(block => {
      const trimmedBlock = block.trim();
      if (trimmedBlock === '') {
        return ''; // 移除空块
      }
      // 检查块是否已包含块级HTML标签，如果是则不包装
      // 确保这里包含所有可能由前面Markdown规则生成的块级标签
      if (/^<(h[1-6]|pre|blockquote|ul|ol|div|p|img|table|form)/i.test(trimmedBlock)) {
        return trimmedBlock;
      }
      // 将段落内的单个换行符转换为<br>
      return `<p class="text-gray-800 dark:text-gray-200 leading-relaxed mb-4 last:mb-0">${trimmedBlock.replace(/\n/g, '<br>')}</p>`;
    }).filter(Boolean).join('\n'); // 过滤掉空字符串并用单换行符连接

    return html;
  },

  /**
   * 处理HTML字符串中的特殊链接（如视频嵌入、GitHub卡片、微信卡片）。
   * @param {string} html - 包含潜在特殊链接的HTML字符串。
   * @returns {string} 处理后的HTML字符串。
   * @private
   */
  _processEmbedsAndSpecialLinks(html) {
    /**
     * 通用链接处理辅助函数。
     * @param {RegExp} regex - 用于匹配特殊链接的正则表达式。
     * @param {Function} processor - 处理匹配到的链接并返回相应HTML的函数。
     * @returns {string} 替换后的HTML字符串。
     */
    const processLink = (regex, processor) => {
      // 使用Set追踪已处理的URL，防止重复嵌入和潜在的无限循环
      const processedUrls = new Set();

      return html.replace(new RegExp(regex.source, 'g'), (match, ...args) => {
        // 根据不同regex，URL可能在不同的捕获组中。这里取第一个非空捕获组或整个匹配作为URL
        const urlToCheck = args.find(arg => typeof arg === 'string' && arg.includes('://')) || match;

        if (processedUrls.has(urlToCheck)) {
          return match; // 此URL已处理，跳过
        }

        // 避免重新处理已转换为iframe或特定嵌入容器的元素
        if (match.includes('<iframe') || match.includes('<div class="' + CONFIG.CSS.EMBED_CONTAINER + '">')) {
          return match;
        }

        try {
          const result = processor(match, ...args);
          // 如果处理结果不同于原始匹配，则认为已成功处理，并将其URL标记为已处理
          if (result !== match) {
            processedUrls.add(urlToCheck);
          }
          return result;
        } catch (error) {
          console.error('特殊链接处理错误:', error, match, args);
          return match; // 处理失败，返回原始匹配
        }
      });
    };

    // --- 微信公众号链接 (将其转换为卡片样式) ---
    // 先处理Markdown格式的微信链接 ([title](url))
    html = processLink(CONFIG.REGEX.WECHAT_MD, (match, title, url) => {
      return this._createWechatCard(url, title);
    });

    // 再处理纯URL格式的微信链接
    html = processLink(CONFIG.REGEX.WECHAT, (match) => {
      return this._createWechatCard(match);
    });

    // --- 视频、音频、GitHub等嵌入内容 ---
    const embedHandlers = [
      {
        regex: CONFIG.REGEX.YOUTUBE,
        createEmbed: (match, videoId) => {
          if (!videoId) return match;
          const embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=0`;
          return this._createEmbedHTML(embedSrc, 'w-full aspect-video', 'frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen');
        }
      },
      {
        regex: CONFIG.REGEX.BILIBILI,
        createEmbed: (match, avid, bvid) => {
          const id = bvid || avid;
          if (!id) return match;
          const embedSrc = `https://player.bilibili.com/player.html?${bvid ? 'bvid=' + bvid : 'aid=' + avid.replace('av', '')}&high_quality=1`;
          return this._createEmbedHTML(embedSrc, 'w-full aspect-video');
        }
      },
      {
        regex: CONFIG.REGEX.DOUYIN,
        createEmbed: (match, vid1, vid2) => {
          const vid = vid1 || vid2;
          if (!vid) return match;
          const embedSrc = `https://www.douyin.com/video/${vid}`;
          // 注意：抖音的iframe嵌入可能需要额外的SDK或特殊处理才能完全显示
          return this._createEmbedHTML(embedSrc, 'w-full aspect-video douyin-container');
        }
      },
      {
        regex: CONFIG.REGEX.TIKTOK,
        createEmbed: (match, vid) => {
          if (!vid) return match;
          const embedSrc = `https://www.tiktok.com/embed/v2/${vid}`;
          // 注意：TikTok的iframe嵌入可能需要额外的SDK或特殊处理才能完全显示
          return this._createEmbedHTML(embedSrc, 'w-full aspect-video');
        }
      },
      {
        regex: CONFIG.REGEX.NETEASE,
        createEmbed: (match, songId) => {
          if (!songId) return match;
          const embedSrc = `https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`;
          return this._createEmbedHTML(embedSrc, 'w-full h-24');
        }
      },
      {
        regex: CONFIG.REGEX.GITHUB,
        createEmbed: (match, repoPath) => { // repoPath is the capture group that contains the repo owner/name
          if (!repoPath) return match;
          return utils.createHtml`<div class="my-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center space-x-3">
            <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <a href="${match}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK} flex-1 truncate">
              ${repoPath}
            </a>
          </div>`;
        }
      }
    ];

    // 遍历并处理所有嵌入类型
    embedHandlers.forEach(handler => {
      html = processLink(handler.regex, handler.createEmbed);
    });

    return html;
  },

  /**
   * 创建用于嵌入视频/音频的HTML iframe结构。
   * @param {string} embedSrc - iframe的`src` URL。
   * @param {string} [containerClass=''] - 容器div的额外CSS类。
   * @param {string} [attributes=''] - iframe的额外HTML属性（如`allowfullscreen`）。
   * @returns {string} 嵌入HTML字符串。
   * @private
   */
  _createEmbedHTML(embedSrc, containerClass = '', attributes = '') {
    const cssClass = containerClass ? `${CONFIG.CSS.EMBED_CONTAINER} ${containerClass}` : CONFIG.CSS.EMBED_CONTAINER;
    return utils.createHtml`<div class="${cssClass}">
      <iframe src="${embedSrc}" ${attributes} loading="lazy"></iframe>
    </div>`;
  },

  /**
   * 创建微信公众号文章的卡片样式HTML。
   * @param {string} url - 微信文章的URL。
   * @param {string} [title='微信公众号文章'] - 文章标题。
   * @returns {string} 微信卡片HTML字符串。
   * @private
   */
  _createWechatCard(url, title = '微信公众号文章') {
    // 对URL进行URI编码，确保其在HTML属性中安全
    let encodedUrl = encodeURI(url);

    // 对标题进行HTML实体转义，防止XSS和显示问题
    let escapedTitle = title
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, ''');

    return utils.createHtml`<div class="my-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center space-x-3">
      <svg class="w-6 h-6 text-green-600 dark:text-green-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.328.328 0 00.166-.054l1.9-1.106a.598.598 0 01.504-.042 10.284 10.284 0 003.055.462c.079 0 .158-.001.237-.003a3.57 3.57 0 00-.213-1.88 7.354 7.354 0 01-4.53-6.924c0-3.195 2.738-5.766 6.278-5.951h.043l.084-.001c.079 0 .158 0 .237.003 3.738.186 6.705 2.875 6.705 6.277 0 3.073-2.81 5.597-6.368 5.806a.596.596 0 00-.212.043c-.09.019-.166.07-.237.117h-.036c-.213 0-.416-.036-.618-.073l-.6-.083a.71.71 0 00-.213-.035 1.897 1.897 0 00-.59.095l-1.208.581a.422.422 0 01-.16.036c-.164 0-.295-.13-.295-.295 0-.059.019-.118.037-.165l.075-.188.371-.943c.055-.14.055-.295-.018-.413a3.68 3.68 0 01-.96-1.823c-.13-.414-.206-.846-.213-1.278a3.75 3.75 0 01.891-2.431c-.002 0-.002-.001-.003-.004a5.7 5.7 0 01-.493.046c-.055.003-.11.004-.165.004-4.801 0-8.691-3.288-8.691-7.345 0-4.056 3.89-7.346 8.691-7.346M18.3 15.342a.496.496 0 01.496.496.509.509 0 01-.496.496.509.509 0 01-.497-.496.497.497 0 01.497-.496m-4.954 0a.496.496 0 01.496.496.509.509 0 01-.496.496.509.509 0 01-.497-.496.497.497 0 01.497-.496M23.999 17.33c0-3.15-3.043-5.73-6.786-5.943a7.391 7.391 0 00-.283-.004c-3.849 0-7.067 2.721-7.067 6.23 0 3.459 3.055 6.175 6.848 6.227.059.001.118.003.177.003a8.302 8.302 0 002.484-.377.51.51 0 01.426.035l1.59.93c.06.036.118.048.177.048.142 0 .26-.118.26-.26 0-.07-.018-.13-.048-.189l-.331-1.243a.515.515 0 01.178-.555c1.563-1.091 2.575-2.765 2.575-4.902"/>
      </svg>
      <a href="${encodedUrl}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">
        ${escapedTitle}
      </a>
    </div>`;
  }
};

// 简化版Markdown渲染，直接调用缓存的渲染器。
// 如果确实需要一个不使用缓存的版本，此函数需要直接调用 `_renderMarkdownToBasicHtml` 和 `_processEmbedsAndSpecialLinks`。
export function simpleMarkdown(text) {
  if (!text) return '';
  return markdownRenderer.render(text);
}