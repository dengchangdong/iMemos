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
    html = html.replace(/<li.*?>[\s\S]*?<\/li>/g, match => `<ul class="my-4">${match}</ul>`);
    
    // 粗体
    html = html.replace(CONFIG.REGEX.MD_BOLD, '<strong>$1</strong>');
    
    // 斜体
    html = html.replace(CONFIG.REGEX.MD_ITALIC, '<em>$1</em>');
    
    // 链接
    html = html.replace(CONFIG.REGEX.MD_LINK, '<a href="$2" class="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">$1</a>');
    
    // 图片
    html = html.replace(CONFIG.REGEX.MD_IMAGE, '<img src="$2" alt="$1" class="my-4 rounded-lg max-w-full h-auto" loading="lazy">');
    
    // 标签
    html = html.replace(CONFIG.REGEX.TAG, '<span class="text-blue-500 dark:text-blue-400">#$1</span>');
    
    // 段落
    html = html.replace(/\n\n([^<\n][\s\S]*?)(?=\n\n|$)/g, '<p class="my-4">$1</p>');
    
    return html;
  },
  
  // 处理特殊链接（视频、音乐等）
  processSpecialLinks(text) {
    return text;
  }
}