import { CONFIG } from './config'
import { utils } from './utils'

export const markdownRenderer = {
  cache: new Map(),
  render(text) {
    if (!text) return '';
    const cacheKey = text;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    const containsSpecialLinks = 
      text.includes('youtube.com') || 
      text.includes('bilibili.com') || 
      text.includes('douyin.com') || 
      text.includes('tiktok.com') || 
      text.includes('music.163.com') || 
      text.includes('github.com') || 
      text.includes('mp.weixin.qq.com');
    const markdown = this.ensureMarkdown(text);
    let html;
    if (containsSpecialLinks) {
      const preProcessed = this.processSpecialLinks(markdown);
      html = this.renderToHtml(preProcessed);
    } else {
      html = this.renderToHtml(markdown);
      html = this.processSpecialLinks(html);
    }
    this.cache.set(cacheKey, html);
    return html;
  },
  ensureMarkdown(text) {
    const containsMarkdown = 
      text.includes('# ') || 
      text.includes('## ') || 
      text.includes('### ') || 
      text.includes('```') || 
      text.includes('*') || 
      text.includes('> ') ||
      /\[.*\]\(.*\)/.test(text);
    if (containsMarkdown) {
      return text;
    }
    return text;
  },
  renderToHtml(text) {
    let html = text;
    html = html.replace(/\n{2,}/g, '\n\n');
    html = html.replace(CONFIG.REGEX.MD_CODE_BLOCK, (match, lang, code) => 
      utils.createHtml`<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto my-4"><code class="language-${lang || 'plaintext'}">${utils.escapeHtml(code)}</code></pre>`
    );
    html = html.replace(CONFIG.REGEX.MD_INLINE_CODE, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">$1</code>');
    html = html.replace(CONFIG.REGEX.MD_H1, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
    html = html.replace(CONFIG.REGEX.MD_H2, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');
    html = html.replace(CONFIG.REGEX.MD_H3, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    html = html.replace(CONFIG.REGEX.MD_QUOTE, '<blockquote class="pl-4 border-l-4 border-gray-300 dark:border-gray-600 my-4 text-gray-600 dark:text-gray-400">$1</blockquote>');
    html = html.replace(CONFIG.REGEX.MD_LIST_ITEM, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(CONFIG.REGEX.MD_NUM_LIST, '<li class="ml-4 list-decimal">$2</li>');
    html = html.replace(/(<li.*>.*<\/li>\n)+/g, (match) => {
      if (match.includes('list-decimal')) {
        return `<ol class="my-4">${match}</ol>`;
      }
      return `<ul class="my-4">${match}</ul>`;
    });
    html = html.replace(CONFIG.REGEX.MD_BOLD, '<strong>$1</strong>');
    html = html.replace(CONFIG.REGEX.MD_ITALIC, '<em>$1</em>');
    html = html.replace(CONFIG.REGEX.MD_IMAGE, 
      '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4" loading="lazy" data-preview="true" />'
    );
    html = html.replace(CONFIG.REGEX.MD_LINK, (match, text, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">${text}</a>`;
    });
    html = html.replace(CONFIG.REGEX.TAG, (match, tag) => {
      return `<a href="/tag/${tag}" class="${CONFIG.CSS.LINK}">#${tag}</a>`;
    });
    html = html.replace(/(^|[^"=])(https?:\/\/(?!mp\.weixin\.qq\.com)[^\s<]+[^<.,:;"')\]\s])/g, (match, prefix, url) => {
      return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="${CONFIG.CSS.LINK}">${url}</a>`;
    });
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(para => {
      if (para.trim() === '' || /^<(h[1-6]|pre|blockquote|ul|ol|div|p)/.test(para)) {
        return para;
      }
      return `<p class="text-gray-800 dark:text-gray-200 leading-relaxed">${para.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
    return html;
  },
  processSpecialLinks(html) {
    if (html.includes('<iframe') || html.includes('<div class="' + CONFIG.CSS.EMBED_CONTAINER + '">')) {
      return html;
    }
    const processLink = (regex, linkProcessor) => {
      const processedMarker = {};
      html = html.replace(new RegExp(regex.source, 'g'), (match, ...args) => {
        const markerId = match.slice(0, 20) + (args[0] || '');
        if (processedMarker[markerId]) {
          return match;
        }
        if (new RegExp(`href=["']${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(html)) {
          return match;
        }
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
    const processMediaEmbed = (regex, createEmbedHTML) => {
      const processedMarker = {};
      html = html.replace(new RegExp(regex.source, 'g'), (match, ...args) => {
        const markerId = match.slice(0, 20) + (args[0] || '');
        if (processedMarker[markerId]) {
          return match;
        }
        processedMarker[markerId] = true;
        try {
          const embedSrc = typeof createEmbedHTML.embedSrc === 'function' 
            ? createEmbedHTML.embedSrc(match, ...args) 
            : '';
          if (html.includes(`src="${embedSrc}"`) || 
              html.includes(`src="${embedSrc.replace('http:', '')}"`)) {
            return match;
          }
          if (!embedSrc) {
            console.error('无法生成嵌入源:', match, args);
            return match;
          }
          const isDouyin = embedSrc.includes('open.douyin.com');
          const containerClass = isDouyin 
            ? `${CONFIG.CSS.EMBED_CONTAINER} douyin-container` 
            : CONFIG.CSS.EMBED_CONTAINER;
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
    html = processLink(CONFIG.REGEX.WECHAT_MD, (match, title, url) => {
      return this.createWechatCard(url, title);
    });
    html = processLink(CONFIG.REGEX.WECHAT, (match) => {
      return this.createWechatCard(match, '微信公众号文章');
    });
    html = processMediaEmbed(CONFIG.REGEX.YOUTUBE, {
      embedSrc: function(match, videoId) {
        if (!videoId || typeof videoId !== 'string') {
          console.error('无效的YouTube视频ID:', videoId);
          return '';
        }
        return `https://www.youtube.com/embed/${videoId}?autoplay=0`;
      },
      attributes: 'class="w-full aspect-video" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen'
    });
    html = processMediaEmbed(CONFIG.REGEX.BILIBILI, {
      embedSrc: function(match, avid, bvid) {
        if (bvid && typeof bvid === 'string') {
          return `https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1&danmaku=0&autoplay=0`;
        } 
        else if (avid && typeof avid === 'string') {
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
    html = processMediaEmbed(CONFIG.REGEX.DOUYIN, {
      embedSrc: function(match, videoId, vidParam) {
        const finalVideoId = videoId || vidParam;
        if (!finalVideoId || typeof finalVideoId !== 'string') {
          console.error('无效的抖音视频ID:', match);
          return '';
        }
        return `https://open.douyin.com/player/video?vid=${finalVideoId}&autoplay=0`;
      },
      attributes: 'style="aspect-ratio: .4821; width: min(324px, 100%); margin: auto;" scrolling="no" frameborder="no" allowfullscreen referrerpolicy="unsafe-url"'
    });
    html = processMediaEmbed(CONFIG.REGEX.TIKTOK, {
      embedSrc: function(match, videoId) {
        if (!videoId || typeof videoId !== 'string') {
          return '';
        }
        return `https://www.tiktok.com/embed/v2/${videoId}?autoplay=0`;
      },
      attributes: 'class="w-full aspect-video" scrolling="no" frameborder="no" allowfullscreen'
    });
    html = processMediaEmbed(CONFIG.REGEX.NETEASE, {
      embedSrc: function(match, songId) {
        if (!songId || typeof songId !== 'string') {
          return '';
        }
        return `//music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`;
      },
      attributes: 'class="w-full h-[86px]" frameborder="no" border="0" marginwidth="0" marginheight="0"'
    });
    html = processLink(CONFIG.REGEX.GITHUB, (match, repo) => {
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
  createWechatCard(url, title = '微信公众号文章') {
    if (!url || typeof url !== 'string') {
      console.error('无效的微信公众号URL:', url);
      return '';
    }
    url = url.replace(/[<>"]'/g, match => {
      switch (match) {
        case '<': return '%3C';
        case '>': return '%3E';
        case '"': return '%22';
        case "'": return '%27';
        default: return match;
      }
    });
    title = title.replace(/[<>"]'/g, '');
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

export function simpleMarkdown(text) {
  return markdownRenderer.render(text);
} 