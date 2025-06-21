import { html } from 'hono/html'
import { CONFIG } from './config.js'
import { utils } from './utils.js'
import { simpleMarkdown } from './markdown.js'

/**
 * 优化HTML模板渲染 - 减少重复代码
 */
export const htmlTemplates = {
  /**
   * 错误页面模板
   * @param {Error} error - 错误对象
   * @returns {string} 错误页面HTML
   */
  errorPage(error) {
    return createArticleStructure(
      utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>`,
      utils.createHtml`
        <p class="text-red-600 dark:text-red-400 font-medium">加载失败</p>
        <p class="text-sm">${error.message}</p>
        <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
      `
    );
  },
  
  /**
   * 404页面模板
   * @returns {string} 404页面HTML
   */
  notFoundPage() {
    return createArticleStructure(
      utils.createHtml`<time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">404</time>`,
      utils.createHtml`
        <h2 class="font-medium">未找到内容</h2>
        <p>您访问的内容不存在或已被删除</p>
        <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
      `
    );
  }
}

// 解析导航链接
export function parseNavLinks(linksStr) {
  if (!linksStr) return []
  try {
    const jsonStr = linksStr.replace(/'/g, '"')
    const linksObj = JSON.parse(jsonStr)
    return Object.entries(linksObj).map(([text, url]) => ({ text, url }))
  } catch (error) {
    console.error('解析导航链接失败:', error)
    return []
  }
}

// 创建文章结构
function createArticleStructure(header, content) {
  return utils.createHtml`
    <article class="article">
      <header>${header}</header>
      <section class="article-content">
        ${content}
      </section>
    </article>
  `;
}

/**
 * 渲染单个 memo
 * @param {Object} memo - memo对象
 * @param {boolean} [isHomePage=false] - 是否在首页显示
 * @returns {string} 渲染后的HTML
 */
export function renderMemo(memo, isHomePage = false) {
  try {
    const timestamp = memo.createTime 
      ? new Date(memo.createTime).getTime()
      : memo.createdTs * 1000
    
    const formattedTime = utils.formatTime(timestamp)
    const content = memo.content || ''
    const parsedContent = simpleMarkdown(content)
    const resources = memo.resources || memo.resourceList || []
    
    // 创建图片资源HTML
    const resourcesHtml = resources.length > 0 ? createResourcesHtml(resources) : ''
    
    // 文章URL
    const articleUrl = isHomePage ? `/post/${memo.name}` : '#'
    
    // 创建文章头部
    const header = utils.createHtml`
      <div class="article-header">
        <a class="article-link" href="${articleUrl}">
          <time datetime="${new Date(timestamp).toISOString()}" class="article-time">${formattedTime}</time>
        </a>
      </div>
    `;
    
    // 创建文章内容
    const articleContent = utils.createHtml`
      ${parsedContent}
      ${resourcesHtml}
    `;
    
    return createArticleStructure(header, articleContent);
  } catch (error) {
    console.error('渲染 memo 失败:', error)
    return createArticleStructure(
      utils.createHtml`<time class="error-time">错误</time>`,
      utils.createHtml`<p class="error-message">渲染失败: ${error.message}</p>`
    );
  }
}

// 创建资源HTML
const renderImageItem = (resource, itemClass) => {
  const originalLink = resource.externalLink || '';
  const transformedLink = originalLink.replace(
    'images-memos.dengchangdong.com',
    'images-memos.dengchangdong.com/cdn-cgi/image/h=800'
  );

  return utils.createHtml`
    <div class="image-container ${itemClass}">
      <img src="${transformedLink}" alt="${resource.filename || '图片'}" class="preview-image" loading="lazy" data-preview="true"/>
      <div class="image-placeholder">
        <i class="ri-image-line"></i>
      </div>
    </div>
  `;
};

function createResourcesHtml(resources) {
  const count = resources.length;

  if (count === 0) {
    return '';
  }

  let containerClass = '';
  let itemClass = '';
  
  // 根据图片数量选择布局
  if (count === 1) {
    containerClass = '';
    itemClass = 'single-image';
  } else if (count === 2) {
    containerClass = 'two-images-container';
    itemClass = 'two-images-item';
  } else {
    containerClass = 'multi-images-container';
    itemClass = '';
  }

  const imagesHtml = resources
    .map(resource => renderImageItem(resource, itemClass))
    .join('');

  const content = containerClass
    ? `<div class="${containerClass}">${imagesHtml}</div>`
    : imagesHtml;

  return utils.createHtml`
    <figure class="images-figure">
      ${content}
    </figure>
  `;
}

// 渲染分页导航
function renderPagination({ currentPage, hasMore, isHomePage, tag = '' }) {
  if (!isHomePage && !tag) {
    return '';
  }

  if (isHomePage && currentPage === 1) {
    return utils.createHtml`
      <div class="pagination">
        <a href="/page/2" class="pagination-button">
          <i class="ri-arrow-down-line pagination-icon"></i> 查看更多内容
        </a>
      </div>
    `;
  }

  const prevPageLink = currentPage > 2 ? `/page/${currentPage - 1}` : '/';
  const nextPageLink = `/page/${currentPage + 1}`;

  return utils.createHtml`
    <div class="pagination">
      <a href="${prevPageLink}" class="pagination-button">
        <i class="ri-arrow-left-line pagination-icon"></i> 上一页
      </a>
      <span class="pagination-number">第 ${currentPage} 页</span>
      <a href="${nextPageLink}" class="pagination-button ${hasMore ? '' : 'invisible'}">
        下一页 <i class="ri-arrow-right-line pagination-icon"></i>
      </a>
    </div>
  `;
}

// 渲染基础 HTML
export function renderBaseHtml(title, content, navLinks, siteName, currentPage = 1, hasMore = false, isHomePage = false, tag = '') {
  const navItems = parseNavLinks(navLinks)
  const navItemsHtml = navItems.length > 0 
    ? navItems.map(item => utils.createHtml`
        <li><a href="${item.url}" class="nav-link">${item.text}</a></li>
      `).join('')
    : '';

  const articlesHtml = Array.isArray(content) ? content.join('') : content;

  return utils.createHtml`
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="${siteName}">
        <meta name="theme-color" content="#209cff">
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500&family=Roboto&display=swap" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/3.5.0/remixicon.min.css" rel="stylesheet">
        <style>
          /* 全局样式 */
          :root {
            --color-blue-50: #eff6ff;
            --color-blue-100: #dbeafe;
            --color-blue-200: #bfdbfe;
            --color-blue-400: #60a5fa;
            --color-blue-500: #3b82f6;
            --color-blue-700: #1d4ed8;
            --color-blue-900: #1e3a8a;
            --color-gray-100: #f3f4f6;
            --color-gray-300: #d1d5db;
            --color-gray-400: #9ca3af;
            --color-gray-500: #6b7280;
            --color-gray-700: #374151;
            --color-gray-800: #1f2937;
            --color-indigo-300: #a5b4fc;
            --color-indigo-400: #818cf8;
            --color-indigo-600: #4f46e5;
            --color-red-400: #f87171;
            --color-red-500: #ef4444;
            --color-white: #ffffff;
            --color-black: #000000;
            --color-indigo-timeline: #4e5ed3;
            --color-indigo-shadow: #bab5f8;
            
            --gradient-custom: linear-gradient(45deg, #209cff, #68e0cf);
            --gradient-custom-dark: linear-gradient(45deg, #0f4c81, #2c7873);
            
            --font-sans: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
            --font-poppins: 'Poppins', sans-serif;
          }

          html.dark {
            --color-bg: var(--gradient-custom-dark);
            --color-card-bg: var(--color-gray-800);
            --color-text: var(--color-gray-100);
            --color-text-secondary: var(--color-gray-400);
            --color-link: var(--color-indigo-400);
            --color-link-hover: var(--color-indigo-300);
            --color-border: var(--color-indigo-400);
            --color-timeline-shadow: var(--color-indigo-600);
            --color-card-accent: rgba(129, 140, 248, 0.3);
            --color-button-bg: var(--color-blue-500);
            --color-button-hover: var(--color-blue-700);
          }
          
          html {
            --color-bg: var(--gradient-custom);
            --color-card-bg: var(--color-blue-50);
            --color-text: var(--color-gray-700);
            --color-text-secondary: var(--color-gray-500);
            --color-link: var(--color-blue-500);
            --color-link-hover: var(--color-blue-700);
            --color-border: var(--color-indigo-300);
            --color-timeline-shadow: var(--color-indigo-shadow);
            --color-card-accent: rgba(147, 197, 253, 0.3);
            --color-button-bg: var(--color-blue-500);
            --color-button-hover: var(--color-blue-700);
            scroll-behavior: smooth;
          }

          html, body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            font-family: var(--font-sans);
          }
          
          body {
            background: var(--color-bg);
            background-attachment: fixed;
          }
          
          a {
            text-decoration: none;
            color: var(--color-link);
            transition: color 0.2s ease;
          }
          
          a:hover {
            color: var(--color-link-hover);
          }

          html::-webkit-scrollbar, 
          body::-webkit-scrollbar,
          pre::-webkit-scrollbar {
            width: 8px;
            height: 8px;
            background: rgba(255, 255, 255, 0);
            border-radius: 10px;
          }

          html::-webkit-scrollbar-thumb, 
          body::-webkit-scrollbar-thumb,
          pre::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
          }

          html::-webkit-scrollbar-thumb:hover, 
          body::-webkit-scrollbar-thumb:hover,
          pre::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.11);
            border-radius: 10px; 
          }

          html::-webkit-scrollbar-track:hover, 
          body::-webkit-scrollbar-track:hover,
          pre::-webkit-scrollbar-track:hover {
            background: rgba(0, 0, 0, 0);
            border-radius: 10px; 
          }
          
          /* 容器样式 */
          .container {
            width: 100%;
            max-width: 36rem;
            margin: 0 auto;
            padding: 3rem 1rem;
          }
          
          @media (min-width: 1921px) {
            .container {
              max-width: 42rem;
            }
          }
          
          /* 卡片样式 */
          .container > section {
            background-color: var(--color-card-bg);
            padding: 2rem;
            border-radius: 0.75rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            width: 100%;
          }
          
          /* 头部样式 */
          header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          header > div {
            display: flex;
            align-items: center;
          }
          
          /* 标题 */
          h1 {
            font-size: 1.25rem;
            font-weight: 600;
            font-family: var(--font-poppins);
            color: var(--color-text);
            margin: 0;
            letter-spacing: 0.025em;
          }
          
          @media (min-width: 768px) {
            h1 {
              font-size: 1.125rem;
            }
          }
          
          /* 导航 */
          nav {
            margin-right: 0.25rem;
          }
          
          nav ul {
            display: flex;
            list-style-type: none;
            padding: 0;
            margin: 0;
            gap: 0.5rem;
          }
          
          .nav-link {
            padding: 0.375rem 0.75rem;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--color-link);
            transition: background-color 0.2s ease, color 0.2s ease;
          }
          
          .nav-link:hover {
            background-color: rgba(219, 234, 254, 0.7);
            color: var(--color-link-hover);
          }
          
          .dark .nav-link:hover {
            background-color: rgba(30, 58, 138, 0.5);
          }
          
          /* 主题切换按钮 */
          #theme-toggle {
            width: 2.25rem;
            height: 2.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9999px;
            background-color: var(--color-blue-100);
            color: var(--color-blue-500);
            border: none;
            cursor: pointer;
            transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          
          #theme-toggle:hover {
            background-color: var(--color-blue-200);
            color: var(--color-blue-700);
          }
          
          #theme-toggle:focus {
            outline: none;
          }
          
          #theme-icon {
            font-size: 1.125rem;
          }
          
          /* 主体内容 */
          main {
            margin-top: 2rem;
            position: relative;
          }
          
          /* 文章样式 */
          .article {
            padding-bottom: 2rem;
            border-left: 1px solid var(--color-border);
            position: relative;
            padding-left: 1.25rem;
            margin-left: 0.75rem;
          }
          
          .article:last-child {
            border: 0;
            padding-bottom: 0;
          }
          
          .article::before {
            content: '';
            width: 17px;
            height: 17px;
            background: var(--color-white);
            border: 1px solid var(--color-indigo-timeline);
            border-radius: 9999px;
            position: absolute;
            left: -9px;
            top: 0;
            box-shadow: 3px 3px 0px var(--color-indigo-shadow);
          }
          
          .dark .article::before {
            background: var(--color-gray-800);
            border-color: var(--color-indigo-400);
            box-shadow: 3px 3px 0px var(--color-indigo-600);
          }
          
          .article-header {
            display: flex;
          }
          
          .article-link {
            display: block;
          }
          
          .article-time {
            color: var(--color-indigo-600);
            font-family: var(--font-poppins);
            font-weight: 600;
            font-size: 0.75rem;
            display: block;
            transition: color 0.2s ease;
          }
          
          @media (min-width: 768px) {
            .article-time {
              font-size: 0.875rem;
            }
          }
          
          .article-time:hover {
            color: var(--color-indigo-timeline);
          }
          
          .dark .article-time {
            color: var(--color-indigo-400);
          }
          
          .dark .article-time:hover {
            color: var(--color-indigo-300);
          }
          
          .article-content {
            color: var(--color-text);
            line-height: 1.625;
            margin-top: 1rem;
            font-size: 0.875rem;
          }
          
          @media (min-width: 768px) {
            .article-content {
              font-size: 1rem;
            }
          }
          
          /* 错误信息 */
          .error-time {
            color: var(--color-indigo-600);
            font-family: var(--font-poppins);
            font-weight: 600;
            font-size: 0.875rem;
            display: block;
          }
          
          .error-message {
            color: var(--color-red-500);
          }
          
          .dark .error-message {
            color: var(--color-red-400);
          }
          
          /* 图片容器 */
          .images-figure {
            margin-top: 1rem;
          }
          
          .image-container {
            position: relative;
            background-color: rgba(219, 234, 254, 0.3);
            border-radius: 0.5rem;
            overflow: hidden;
          }
          
          .dark .image-container {
            background-color: rgba(55, 65, 81, 0.3);
          }
          
          .preview-image {
            border-radius: 0.5rem;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: opacity 0.2s;
            position: absolute;
            inset: 0;
            z-index: 10;
          }
          
          .preview-image:hover {
            opacity: 0.95;
          }
          
          .image-placeholder {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-blue-400);
            transition: opacity 0.3s ease;
            will-change: opacity;
          }
          
          .dark .image-placeholder {
            color: var(--color-blue-300);
          }
          
          .image-placeholder i {
            font-size: 1.5rem;
          }
          
          div.loaded .image-placeholder {
            opacity: 0;
          }
          
          .single-image {
            width: 100%;
            aspect-ratio: 16 / 9;
          }
          
          .two-images-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
          }
          
          .two-images-item {
            width: calc(50% - 0.125rem);
            aspect-ratio: 1 / 1;
          }
          
          .multi-images-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.25rem;
          }
          
          .multi-images-container .image-container {
            aspect-ratio: 1 / 1;
          }
          
          /* 分页导航 */
          .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 2rem;
          }
          
          .pagination-button {
            display: inline-flex;
            align-items: center;
            padding: 0.375rem 1rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s;
            background-color: var(--color-button-bg);
            color: var(--color-white);
            text-decoration: none;
            border: none;
            cursor: pointer;
          }
          
          .pagination-button:hover {
            background-color: var(--color-button-hover);
            transform: translateY(-0.125rem);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            color: var(--color-white);
          }
          
          .pagination-icon {
            font-size: 1.25rem;
          }
          
          .pagination-button:first-child .pagination-icon {
            margin-right: 0.5rem;
          }
          
          .pagination-button:last-child .pagination-icon {
            margin-left: 0.5rem;
          }
          
          .pagination-number {
            font-size: 0.875rem;
            color: var(--color-text-secondary);
          }
          
          .invisible {
            visibility: hidden;
          }
          
          /* 回到顶部按钮 */
          .back-to-top {
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9999px;
            background-color: var(--color-blue-500);
            color: var(--color-white);
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            cursor: pointer;
            z-index: 50;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease-in-out;
            transform: translate3d(0, 0, 0);
          }
          
          .back-to-top:hover {
            background-color: var(--color-blue-700);
            transform: translate3d(0, -0.125rem, 0);
          }
          
          .back-to-top.visible {
            opacity: 1;
            visibility: visible;
          }
          
          .back-to-top i {
            font-size: 1.25rem;
          }
          
          /* 图片预览模态框 */
          .image-modal {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            z-index: 100;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            will-change: opacity;
            display: none;
          }
          
          .image-modal.active {
            display: flex;
            opacity: 1;
          }
          
          .image-modal-content {
            position: relative;
            max-width: 90%;
            max-height: 90%;
            will-change: transform;
            transform: translate3d(0, 0, 0);
          }
          
          .image-modal-close {
            position: absolute;
            top: -2.5rem;
            right: 0;
            color: var(--color-white);
            font-size: 1.5rem;
            cursor: pointer;
            background-color: transparent;
            border: none;
            padding: 0.5rem;
            will-change: transform;
            transform: translate3d(0, 0, 0);
          }
          
          .image-loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: var(--color-white);
            font-size: 1rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.625rem;
          }
          
          .spinner {
            width: 2.5rem;
            height: 2.5rem;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: var(--color-white);
            animation: spin 1s linear infinite;
            will-change: transform;
          }
          
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          
          .image-modal-content img {
            max-width: 100%;
            max-height: 90vh;
            width: auto;
            height: auto;
            object-fit: contain;
            border-radius: 0.375rem;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
            will-change: opacity;
          }
          
          .image-modal-content img.loaded {
            opacity: 1;
          }
          
          .image-modal-prev,
          .image-modal-next {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background-color: rgba(0, 0, 0, 0.5);
            color: var(--color-white);
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
            will-change: transform, background-color;
          }
          
          .image-modal-prev {
            left: 0.625rem;
          }
          
          .image-modal-next {
            right: 0.625rem;
          }
          
          .image-modal-prev:hover,
          .image-modal-next:hover {
            background-color: rgba(0, 0, 0, 0.7);
          }
          
          /* 图片懒加载 */
          .article-content img, .mt-4 img {
            cursor: pointer;
            transition: opacity 0.2s;
            background-color: rgba(12, 124, 213, 0.11);
            opacity: 0.5;
            will-change: opacity;
          }
          
          .article-content img.loaded, .mt-4 img.loaded {
            opacity: 1;
          }
          
          .article-content img:hover, .mt-4 img:hover {
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <section>
            <header>
              <div>
                <a href="/" aria-label="返回首页">
                  <h1>${siteName}</h1>
                </a>
              </div>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <nav aria-label="网站导航">
                  <ul>
                    ${navItemsHtml}
                  </ul>
                </nav>
                <button id="theme-toggle" aria-label="切换主题">
                  <i class="ri-sun-fill" id="theme-icon" aria-hidden="true"></i>
                </button>
              </div>
            </header>
            <main>
              ${articlesHtml}
            </main>
            
            <!-- 分页导航 -->
            ${renderPagination({ currentPage, hasMore, isHomePage, tag })}
          </section>
        </div>

        <button 
          id="back-to-top" 
          class="back-to-top"
          aria-label="返回顶部"
        >
          <i class="ri-skip-up-fill" aria-hidden="true"></i>
        </button>
        
        <!-- 图片预览模态框 -->
        <div 
          id="imageModal" 
          class="image-modal"
          aria-modal="true" 
          aria-label="图片预览"
        >
          <div class="image-modal-content">
            <button 
              class="image-modal-close"
              aria-label="关闭预览"
            >
              <i class="ri-close-line" aria-hidden="true"></i>
            </button>
            
            <div 
              class="image-loading"
              role="status" 
              aria-live="polite"
            >
              <div class="spinner"></div>
              <span>加载中...</span>
            </div>
            
            <figure>
              <img 
                id="modalImage" 
                src="" 
                alt="预览图片" 
                loading="lazy" 
                class=""
              >
            </figure>
            
            <button 
              class="image-modal-prev"
              aria-label="上一张"
            >
              <i class="ri-arrow-left-s-line" aria-hidden="true"></i>
            </button>
            
            <button 
              class="image-modal-next"
              aria-label="下一张"
            >
              <i class="ri-arrow-right-s-line" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <script>
        ${clientScript}
        </script>
      </body>
    </html>
  `;
}

const clientScript = `
  (function() {
    function safeDomUpdate(callback) {
      requestAnimationFrame(callback);
    }

    // 主题切换功能
    function initThemeToggle() {
      const themeToggle = document.getElementById('theme-toggle');
      const themeIcon = document.getElementById('theme-icon');
      const html = document.documentElement;

      const THEMES = ['system', 'light', 'dark'];
      let currentThemeIndex = 0; // 0: system, 1: light, 2: dark

      const themeConfig = {
        'light': {
          icon: 'ri-sun-fill',
          label: '切换到深色模式',
          apply: () => { html.classList.remove('dark'); localStorage.theme = 'light'; }
        },
        'dark': {
          icon: 'ri-moon-fill',
          label: '切换到浅色模式',
          apply: () => { html.classList.add('dark'); localStorage.theme = 'dark'; }
        },
        'system': {
          icon: 'ri-contrast-fill',
          label: '切换到系统模式',
          apply: () => {
            localStorage.removeItem('theme');
            html.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
          }
        }
      };

      function updateThemeUI(theme) {
        const config = themeConfig[theme];
        themeIcon.className = \`\${config.icon} text-lg\`;
        themeToggle.setAttribute('aria-label', config.label);
      }

      function applyTheme(theme) {
        safeDomUpdate(() => {
          themeConfig[theme].apply();
          updateThemeUI(theme);
          currentThemeIndex = THEMES.indexOf(theme);
        });
      }
        
      const storedTheme = localStorage.theme;
      if (storedTheme && THEMES.includes(storedTheme)) {
        applyTheme(storedTheme);
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          html.classList.add('dark');
        }
        updateThemeUI('system');
      }

      themeToggle.addEventListener('click', () => {
        currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
        const newTheme = THEMES[currentThemeIndex];
        applyTheme(newTheme);
      });

      const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemPreferenceChange = (event) => {
        if (!localStorage.theme) {
          safeDomUpdate(() => {
            html.classList.toggle('dark', event.matches);
          });
        }
      };
      mediaQueryList.addEventListener('change', handleSystemPreferenceChange);
    }

    // 返回顶部功能
    function initBackToTop() {
      const backToTopBtn = document.getElementById('back-to-top');
      if (!backToTopBtn) return;

      const pageTopSentinel = document.createElement('div');
      Object.assign(pageTopSentinel.style, {
        position: 'absolute', top: '0', left: '0', width: '1px', height: '1px', pointerEvents: 'none'
      });
      document.body.appendChild(pageTopSentinel);

      const observer = new IntersectionObserver((entries) => {
        safeDomUpdate(() => {
          backToTopBtn.classList.toggle('visible', !entries[0].isIntersecting);
        });
      }, {
        threshold: 0,
        rootMargin: '300px 0px 0px 0px'
      });

      observer.observe(pageTopSentinel);

      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // 图片预览功能
    function initImageViewer() {
      const modal = document.getElementById('imageModal');
      const modalImg = document.getElementById('modalImage');
      const closeBtn = modal?.querySelector('.image-modal-close');
      const prevBtn = modal?.querySelector('.image-modal-prev');
      const nextBtn = modal?.querySelector('.image-modal-next');
      const loadingIndicator = modal?.querySelector('.image-loading');

      if (!modal || !modalImg || !closeBtn || !prevBtn || !nextBtn || !loadingIndicator) {
        console.warn('Image viewer elements not found. Skipping initialization.');
        return;
      }

      let currentArticleImages = [];
      let currentIndex = 0;
      let isModalActive = false;

      const lazyLoadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
              img.src = dataSrc;
              img.removeAttribute('data-src');
            }
            lazyLoadObserver.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });

      function loadImageIntoModal(imgElement) {
        loadingIndicator.style.display = 'flex';
        modalImg.classList.remove('loaded');

        modalImg.src = imgElement.currentSrc || imgElement.src;
        modalImg.alt = imgElement.alt || '预览图片';

        modalImg.onload = null;
        modalImg.onerror = null;

        const handleLoad = () => {
          modalImg.classList.add('loaded');
          loadingIndicator.style.display = 'none';
        };
        const handleError = () => {
          loadingIndicator.style.display = 'none';
          console.error('Modal image failed to load:', modalImg.src);
        };

        if (modalImg.complete && modalImg.naturalWidth > 0) {
          handleLoad();
        } else {
          modalImg.onload = handleLoad;
          modalImg.onerror = handleError;
        }
      }

      function updateNavigationButtons() {
        const hasMultipleImages = currentArticleImages.length > 1;
        safeDomUpdate(() => {
          prevBtn.style.display = hasMultipleImages ? 'flex' : 'none';
          nextBtn.style.display = hasMultipleImages ? 'flex' : 'none';
        });
      }

      function showImageInModal(img, index) {
        if (isModalActive) return;

        isModalActive = true;
        currentIndex = index;

        safeDomUpdate(() => {
          loadImageIntoModal(img);
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
          updateNavigationButtons();
        });
      }

      function navigateImages(direction) { 
        if (currentArticleImages.length <= 1) return;

        currentIndex = (currentIndex + direction + currentArticleImages.length) % currentArticleImages.length;
        const targetImg = currentArticleImages[currentIndex];

        if (targetImg) {
          loadImageIntoModal(targetImg);
        }
      }

      function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        isModalActive = false;

        currentArticleImages = [];
        currentIndex = 0;
      }

      function getAllPreviewImages() {
        return Array.from(document.querySelectorAll('[data-preview="true"]'));
      }

      function getImagesInContext(triggerImg) {
        const article = triggerImg.closest('article');
        return article ? Array.from(article.querySelectorAll('[data-preview="true"]')) : getAllPreviewImages();
      }

      function setupPageImages() {
        getAllPreviewImages().forEach(img => {
          if (!img.dataset.src && img.src && !img.src.startsWith('data:image/svg+xml')) {
            img.setAttribute('data-src', img.src);
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
          }
          lazyLoadObserver.observe(img);

          if (!img.classList.contains('loaded')) {
            const handleLoad = () => {
              if (img.complete && img.naturalWidth > 0) {
                img.classList.add('loaded');
                if (img.parentNode) img.parentNode.classList.add('loaded');
              }
              img.removeEventListener('load', handleLoad); 
              img.removeEventListener('error', handleError);
            };
            const handleError = () => {
              console.error('Image failed to load:', img.src);
              img.removeEventListener('load', handleLoad);
              img.removeEventListener('error', handleError);
            };

            if (img.complete) {
              if (img.naturalWidth > 0) {
                handleLoad();
              } else {
                handleError();
              }
            } else {
              img.addEventListener('load', handleLoad);
              img.addEventListener('error', handleError);
            }
          }
        });
      }

      closeBtn.addEventListener('click', closeModal);
      prevBtn.addEventListener('click', () => navigateImages(-1));
      nextBtn.addEventListener('click', () => navigateImages(1));

      modal.addEventListener('click', (e) => {
        if (e.target === modal) { // Clicked on modal background
          closeModal();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        switch(e.key) {
          case 'Escape': closeModal(); break;
          case 'ArrowLeft': navigateImages(-1); break;
          case 'ArrowRight': navigateImages(1); break;
        }
      });

      document.addEventListener('click', (e) => {
        const targetImg = e.target.closest('[data-preview="true"]');
        if (targetImg) {
          e.preventDefault();
          currentArticleImages = getImagesInContext(targetImg);
          const index = currentArticleImages.indexOf(targetImg);
          if (index !== -1) {
            showImageInModal(targetImg, index);
          }
        }
      }, { passive: false });

      const observer = new MutationObserver((mutations) => {
        let hasNewPreviewImages = false;
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE && (node.querySelector('[data-preview="true"]') || node.matches('[data-preview="true"]'))) {
                hasNewPreviewImages = true;
                break;
              }
            }
            if (hasNewPreviewImages) break;
          }
        }
        if (hasNewPreviewImages) {
          setupPageImages();
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setupPageImages();
    }

    // 初始化代码复制功能
    function initCodeCopyButtons() {
      // Helper to update button state after copy operation
      function updateCopyButtonUI(button, success) {
        button.innerHTML = success ? '<i class="ri-check-line"></i>' : '<i class="ri-error-warning-line"></i>';
        button.classList.add('copied');
        setTimeout(() => {
          button.innerHTML = '<i class="ri-file-copy-line"></i>';
          button.classList.remove('copied');
        }, 2000);
      }

      document.querySelectorAll('.code-block').forEach(block => {
        const button = block.querySelector('.copy-btn');
        if (!button) return;

        if (button.dataset.hasCopyListener === 'true') return;
        button.dataset.hasCopyListener = 'true';

        button.addEventListener('click', () => {
          const originalCode = block.getAttribute('data-original-code');
          const codeText = originalCode ? decodeURIComponent(originalCode) : (block.querySelector('code')?.textContent || '');

          navigator.clipboard.writeText(codeText)
            .then(() => updateCopyButtonUI(button, true))
            .catch(() => {
              const textarea = document.createElement('textarea');
              textarea.value = codeText;
              Object.assign(textarea.style, {
                position: 'fixed', opacity: '0', top: '0', left: '0' 
              });
              document.body.appendChild(textarea);
              textarea.select();

              try {
                const successful = document.execCommand('copy');
                updateCopyButtonUI(button, successful);
              } catch (err) {
                console.error('Failed to copy via execCommand:', err);
                updateCopyButtonUI(button, false);
              } finally {
                document.body.removeChild(textarea);
              }
            });
        });
      });
    }

    // 增强的Markdown处理 (主要用于动态内容加载后的代码复制按钮初始化)
    function enhanceMarkdown() {
      const observer = new MutationObserver((mutations) => {
        let hasNewCodeBlocks = false;
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE && (node.querySelector('.code-block') || node.matches('.code-block'))) {
                hasNewCodeBlocks = true;
                break;
              }
            }
            if (hasNewCodeBlocks) break;
          }
        }
        if (hasNewCodeBlocks) {
          initCodeCopyButtons();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      initCodeCopyButtons();
    }

    // 页面加载完成后初始化所有功能
    document.addEventListener('DOMContentLoaded', () => {
      initThemeToggle();
      initImageViewer();
      enhanceMarkdown(); // Handles code copy buttons

      if ('requestIdleCallback' in window) {
        requestIdleCallback(initBackToTop);
      } else {
        setTimeout(initBackToTop, 200);
      }
    });
  })();
`;
