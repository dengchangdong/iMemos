import CONFIG from './config.js';
import utils from './utils.js';

const markdownRenderer = {
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
    html = html.replace(CONFIG.REGEX.MD_IMAGE, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4" loading="lazy" data-preview="true" />');
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
    // ... 省略，直接从 index.js 拷贝完整实现 ...
    // 这里建议直接粘贴原有 processSpecialLinks 及 createWechatCard 方法
    return html;
  },
  // ... 省略 createWechatCard ...
};

function simpleMarkdown(text) {
  return markdownRenderer.render(text);
}

export { markdownRenderer, simpleMarkdown }; 