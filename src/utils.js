/**
 * 帮助函数 - 工具集
 */
export const utils = {
  /**
   * HTML转义，防止XSS攻击
   * @param {string} text - 需要转义的文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },
  
  /**
   * 生成RSS XML
   * @param {Array<Object>} memos - memo对象数组
   * @param {Object} options - RSS选项
   * @param {string} options.siteUrl - 网站URL
   * @param {string} options.siteName - 网站名称
   * @param {string} options.siteDescription - 网站描述
   * @returns {string} RSS XML内容
   */
  generateRSSXml(memos, options) {
    const { siteUrl, siteName, siteDescription } = options;
    
    // 使用UTC+8时区（中国标准时间）
    const now = this.getUTC8Date(new Date()).toUTCString();
    
    // 创建RSS头部
    let rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
    xmlns:atom="http://www.w3.org/2005/Atom" 
    xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${this.escapeHtml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${this.escapeHtml(siteDescription || siteName)}</description>
    <language>zh-cn</language>
    <pubDate>${now}</pubDate>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
`;
    
    // 添加每个memo作为一个item
    memos.forEach(memo => {
      const timestamp = memo.createTime 
        ? new Date(memo.createTime).getTime()
        : memo.createdTs * 1000;
      // 使用UTC+8时区
      const pubDate = this.getUTC8Date(new Date(timestamp)).toUTCString();
      const content = memo.content || '';
      
      // 提取标题（使用内容的第一行或前30个字符）
      let title = content.split('\n')[0].trim();
      if (title.length > 30) {
        title = title.substring(0, 30) + '...';
      }
      if (!title) {
        title = pubDate; // 如果没有标题，使用发布日期
      }
      
      // 生成唯一ID
      const id = memo.id || memo.name || memo.memoId;
      const url = `${siteUrl}/post/${id}`;
      
      // 处理资源（图片）
      let contentWithImages = content;
      const resources = memo.resources || memo.resourceList || [];
      if (resources.length > 0) {
        resources.forEach(resource => {
          const imageUrl = resource.externalLink || '';
          if (imageUrl) {
            contentWithImages += `\n\n<img src="${imageUrl}" alt="${resource.filename || '图片'}" />`;
          }
        });
      }
      
      // 添加该条目到RSS
      rssXml += `    <item>
      <title>${this.escapeHtml(title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <content:encoded><![CDATA[${contentWithImages}]]></content:encoded>
    </item>
`;
    });
    
    // 结束RSS
    rssXml += `  </channel>
</rss>`;
    
    return rssXml;
  },
  
  /**
   * 格式化时间
   * @param {number} timestamp - 时间戳
   * @returns {string} 格式化后的时间字符串
   */
  formatTime(timestamp) {
    const now = this.getUTC8Date(new Date())
    const date = this.getUTC8Date(new Date(timestamp))
    const diff = now - date
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    // 1分钟以内
    if (minutes < 5) return '刚刚'
    
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
  
  /**
   * 获取UTC+8时区（中国标准时间）的日期对象
   * @param {Date} date - 日期对象
   * @returns {Date} 调整为UTC+8时区的日期对象
   */
  getUTC8Date(date) {
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return new Date(utcDate.getTime() + 8 * 60 * 60000);
  },

  /**
   * 创建HTML元素（用于模板）
   * @param {TemplateStringsArray} strings - 模板字符串数组
   * @param {...any} values - 插入值
   * @returns {string} 生成的HTML字符串
   */
  createHtml(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  },

  /**
   * 按时间降序排序memos
   * @param {Array<Object>} memos - memo对象数组
   * @returns {Array<Object>} 排序后的memo数组
   */
  sortMemosByTime(memos) {
    if (!Array.isArray(memos)) return [];
    
    return [...memos].sort((a, b) => {
      const timeA = a.createTime ? new Date(a.createTime).getTime() : a.createdTs * 1000;
      const timeB = b.createTime ? new Date(b.createTime).getTime() : b.createdTs * 1000;
      return timeB - timeA; // 降序排列
    });
  },
  
  /**
   * 统一的代码压缩函数 - 能够根据内容类型自动选择压缩策略
   * @param {string} content - 需要压缩的内容
   * @param {string} [type='auto'] - 内容类型: 'html', 'css', 'js', 或 'auto'(自动检测)
   * @param {object} [options={}] - 压缩选项
   * @returns {string} 压缩后的内容
   */
  minify(content, type = 'auto', options = {}) {
    if (!content || typeof content !== 'string') return '';
    
    // 默认选项
    const defaultOptions = {
      minifyHtml: true,
      minifyCss: true,  
      minifyJs: true,
      debug: false
    };
    
    const opts = { ...defaultOptions, ...options };
    
    // 自动检测内容类型
    if (type === 'auto') {
      if (content.trim().startsWith('<!DOCTYPE') || content.trim().startsWith('<html') || 
          (content.includes('<') && content.includes('</') && content.includes('>'))) {
        type = 'html';
      } else if (content.includes('{') && (content.includes(':') || content.includes('@media') || 
                content.includes('@keyframes'))) {
        type = 'css';
      } else {
        type = 'js';
      }
    }
    
    try {
      // 根据类型调用相应的压缩方法
      switch (type.toLowerCase()) {
        case 'html':
          return this._minifyHtml(content, opts);
        case 'css':
          return this._minifyCss(content, opts);
        case 'js':
          return this._minifyJs(content, opts);
        default:
          console.warn(`未知的内容类型: ${type}, 使用原始内容`);
          return content;
      }
    } catch (error) {
      console.error(`压缩错误 (类型: ${type}):`, error);
      return content; // 出错时返回原始内容
    }
  },
  
  /**
   * 内部HTML压缩函数
   * @private
   */
  _minifyHtml(html, options) {
    try {
      // 先提取并保存所有script和style标签内容
      const preservedContent = new Map();
      let counter = 0;
      
      // 创建唯一占位符并保存内容
      const createPlaceholder = (content) => {
        const id = counter++;
        const placeholder = `___PRESERVED_CONTENT_${id}___`;
        preservedContent.set(placeholder, content);
        return placeholder;
      };
      
      let processedHtml = html;
      
      // 如果启用了JS压缩，处理脚本标签
      if (options.minifyJs) {
        processedHtml = processedHtml.replace(/(<script[\s\S]*?>)([\s\S]*?)(<\/script>)/gi, 
          (match, openTag, content, closeTag) => {
            // 如果是外部脚本或空内容，直接保留
            if (openTag.includes('src=') || !content.trim()) {
              return createPlaceholder(match);
            }
            
            // 压缩JS代码
            const minifiedJs = this._minifyJs(content, options);
            return createPlaceholder(openTag + minifiedJs + closeTag);
          });
      } else {
        // 否则仅保留脚本标签
        processedHtml = processedHtml.replace(/(<script[\s\S]*?<\/script>)/gi, 
          match => createPlaceholder(match));
      }
      
      // 如果启用了CSS压缩，处理样式标签
      if (options.minifyCss) {
        // 处理样式标签
        processedHtml = processedHtml.replace(/(<style[\s\S]*?>)([\s\S]*?)(<\/style>)/gi, 
          (match, openTag, content, closeTag) => {
            // 压缩CSS代码
            const minifiedCss = this._minifyCss(content, options);
            return createPlaceholder(openTag + minifiedCss + closeTag);
          });
          
        // 处理行内样式
        processedHtml = processedHtml.replace(/style=(['"])([\s\S]*?)\1/gi, (match, quote, content) => {
          const minifiedInlineStyle = this._minifyCss(content, options);
          return `style=${quote}${minifiedInlineStyle}${quote}`;
        });
      } else {
        // 否则仅保留样式标签
        processedHtml = processedHtml.replace(/(<style[\s\S]*?<\/style>)/gi, 
          match => createPlaceholder(match));
      }
      
      // 保护模板字符串 ${...}
      processedHtml = processedHtml.replace(/(\${[^}]*})/g, 
        match => createPlaceholder(match));
      
      // 保护HTML特性中的引号内容，避免意外移除空格
      processedHtml = processedHtml.replace(/=\s*(["'])(.*?)\1/g, (match, quote, content) => {
        return '=' + quote + content + quote;
      });
      
      // 执行HTML压缩 - 谨慎处理
      processedHtml = processedHtml
        // 移除HTML注释 (但保留条件注释)
        .replace(/<!--(?!\[if)(?:(?!-->)[\s\S])*-->/g, '')
        // 压缩连续空白字符但保留一个空格
        .replace(/\s{2,}/g, ' ')
        // 小心移除标签间的空白
        .replace(/>\s+</g, '><')
        // 移除标签开始和结束处的空白
        .replace(/\s+>/g, '>')
        .replace(/<\s+/g, '<');
      
      // 恢复所有保留的内容
      preservedContent.forEach((content, placeholder) => {
        processedHtml = processedHtml.replace(placeholder, content);
      });
      
      return processedHtml;
    } catch (error) {
      console.error('HTML压缩过程出错:', error);
      throw error; // 重新抛出错误由主函数处理
    }
  },
  
  /**
   * 内部CSS压缩函数
   * @private
   */
  _minifyCss(css, options) {
    try {
      // 保存字符串和重要片段
      const preserved = [];
      let processedCss = css;
      
      // 保存并替换媒体查询
      processedCss = processedCss.replace(/@media\s+[^{]+\{[\s\S]*?\}/g, (match) => {
        preserved.push(match);
        return `__MEDIA_QUERY_${preserved.length - 1}__`;
      });
      
      // 保存和替换关键帧
      processedCss = processedCss.replace(/@keyframes\s+[^{]+\{[\s\S]*?\}/g, (match) => {
        preserved.push(match);
        return `__KEYFRAMES_${preserved.length - 1}__`;
      });
      
      // 保护url()中的内容
      processedCss = processedCss.replace(/url\s*\(\s*(['"]?)([^'"()]*)\1\s*\)/g, (match, quote, content) => {
        preserved.push(`url(${quote}${content}${quote})`);
        return `__URL_${preserved.length - 1}__`;
      });
      
      // 保护字体名称中的空格
      processedCss = processedCss.replace(/font-family\s*:\s*([^;]+)/g, (match, fontNames) => {
        preserved.push(`font-family:${fontNames}`);
        return `__FONT_${preserved.length - 1}__`;
      });
      
      // 处理主体CSS
      processedCss = processedCss
        // 移除注释
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // 移除多余空格
        .replace(/\s+/g, ' ')
        // 压缩冒号和分号周围的空格
        .replace(/\s*([{}:;,])\s*/g, '$1')
        // 压缩括号前后的空格
        .replace(/\s*{/g, '{')
        .replace(/}\s*/g, '}')
        // 移除分号后的空格
        .replace(/;\s*/g, ';')
        // 压缩颜色值
        .replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g, '#$1$2$3')
        // 转换rgba(0,0,0,0)为transparent
        .replace(/rgba\(0,0,0,0\)/g, 'transparent')
        // 移除0值后的单位
        .replace(/(\s|:)0(px|em|rem|%|vh|vw|vmin|vmax|ch|ex)/g, '$10')
        // 移除0度单位
        .replace(/\b0deg\b/g, '0')
        // 压缩小数点前面的0
        .replace(/(\s|:)0\.(\d+)/g, '$1.$2')
        // 移除尾部分号(如果在花括号前)
        .replace(/;}/g, '}')
        // 压缩
        .trim();
      
      // 恢复被保护的内容
      preserved.forEach((content, i) => {
        processedCss = processedCss
          .replace(`__MEDIA_QUERY_${i}__`, content)
          .replace(`__KEYFRAMES_${i}__`, content)
          .replace(`__URL_${i}__`, content)
          .replace(`__FONT_${i}__`, content);
      });
      
      return processedCss;
    } catch (error) {
      console.error('CSS压缩错误:', error);
      throw error; // 重新抛出错误由主函数处理
    }
  },
  
  /**
   * 内部JS压缩函数
   * @private
   */
  _minifyJs(js, options) {
    try {
      // 保存模板字符串和常规字符串字面量
      const strings = [];
      let processedJs = js;
      
      // 先保护模板字符串 (包含${...}的)
      processedJs = processedJs.replace(/`(?:\\`|[^`])*`/g, (match) => {
        strings.push(match);
        return `__TEMPLATE_STRING_${strings.length - 1}__`;
      });
      
      // 保护常规字符串字面量
      processedJs = processedJs.replace(/(['"])((?:\\\1|(?!\1).)*?)\1/g, (match) => {
        strings.push(match);
        return `__STRING_${strings.length - 1}__`;
      });
      
      // 保护正则表达式
      processedJs = processedJs.replace(/\/(?!\s)(?:\\\/|[^\/\n])+\/[gimuy]*/g, (match) => {
        strings.push(match);
        return `__REGEX_${strings.length - 1}__`;
      });
      
      // 移除注释
      processedJs = processedJs
        // 移除单行注释
        .replace(/\/\/[^\n]*\n/g, '\n')
        // 移除多行注释(但保留重要的文档注释)
        .replace(/\/\*(?!\*|\!)[\s\S]*?\*\//g, '');
      
      // 压缩空白(谨慎处理，保留必要的空格)
      processedJs = processedJs
        // 将多个空格变为一个
        .replace(/\s+/g, ' ')
        // 移除一些不必要的空格
        .replace(/\s*([{}\[\]();:,<>])\s*/g, '$1')
        // 确保操作符周围保留空格，避免意外问题
        .replace(/([=+\-*/%&|^!])\s*([=+\-*/%&|^!])/g, '$1$2')
        .replace(/([=+\-*/%&|^!<>])([\w\d$_])/g, '$1 $2')
        .replace(/([\w\d$_])([=+\-*/%&|^!<>])/g, '$1 $2')
        // 确保关键词后有空格
        .replace(/(if|else|for|while|do|try|catch|finally|switch|return|var|let|const|function|typeof|instanceof|in|of|new|delete|void|yield|async|await)\b(?!\s)/g, '$1 ')
        // 修复分号后缺少空格
        .replace(/;(\S)/g, '; $1');
      
      // 恢复所有字符串和正则表达式
      strings.forEach((str, i) => {
        processedJs = processedJs
          .replace(`__TEMPLATE_STRING_${i}__`, str)
          .replace(`__STRING_${i}__`, str)
          .replace(`__REGEX_${i}__`, str);
      });
      
      return processedJs.trim();
    } catch (error) {
      console.error('JS压缩错误:', error);
      throw error; // 重新抛出错误由主函数处理
    }
  },
  
  // 兼容性函数，保持向后兼容
  minifyHtml(html) {
    return this.minify(html, 'html');
  },
  
  minifyCss(css) {
    return this.minify(css, 'css');
  },
  
  minifyJs(js) {
    return this.minify(js, 'js');
  }
}; 