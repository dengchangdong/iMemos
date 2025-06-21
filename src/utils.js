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
   * 格式化时间
   * @param {number} timestamp - 时间戳
   * @returns {string} 格式化后的时间字符串
   */
  formatTime(timestamp) {
    const now = new Date()
    const date = new Date(timestamp)
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
   * 压缩HTML以减少传输大小 - 专为Cloudflare Workers优化
   * @param {string} html - 原始HTML
   * @returns {string} 压缩后的HTML
   */
  minifyHtml(html) {
    if (!html || typeof html !== 'string') return '';
    
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
      
      // 处理脚本标签 - 提取后压缩JS
      let processedHtml = html.replace(/(<script[\s\S]*?>)([\s\S]*?)(<\/script>)/gi, 
        (match, openTag, content, closeTag) => {
          // 如果是外部脚本或空内容，直接保留
          if (openTag.includes('src=') || !content.trim()) {
            return createPlaceholder(match);
          }
          
          // 压缩JS代码
          const minifiedJs = this.minifyJs(content);
          return createPlaceholder(openTag + minifiedJs + closeTag);
        });
      
      // 处理样式标签 - 提取后压缩CSS
      processedHtml = processedHtml.replace(/(<style[\s\S]*?>)([\s\S]*?)(<\/style>)/gi, 
        (match, openTag, content, closeTag) => {
          // 压缩CSS代码
          const minifiedCss = this.minifyCss(content);
          return createPlaceholder(openTag + minifiedCss + closeTag);
        });
      
      // 保护行内样式
      processedHtml = processedHtml.replace(/style=(['"])([\s\S]*?)\1/gi, (match, quote, content) => {
          const minifiedInlineStyle = this.minifyCss(content);
          return `style=${quote}${minifiedInlineStyle}${quote}`;
      });
      
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
      // 出错时返回原始HTML
      return html;
    }
  },
  
  /**
   * 安全压缩CSS代码，保留功能完整性
   * @param {string} css - CSS代码
   * @returns {string} 压缩后的CSS
   */
  minifyCss(css) {
    if (!css || typeof css !== 'string') return '';
    
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
      return css; // 返回未压缩的CSS
    }
  },
  
  /**
   * 安全压缩JS代码，保留功能完整性
   * @param {string} js - JavaScript代码
   * @returns {string} 压缩后的JavaScript
   */
  minifyJs(js) {
    if (!js || typeof js !== 'string') return '';
    
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
      return js; // 返回未压缩的JS
    }
  }
}; 