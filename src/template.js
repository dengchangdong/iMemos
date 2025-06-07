import { html } from 'hono/html'
import { CONFIG } from './config.js'
import { utils } from './utils.js'
import { simpleMarkdown } from './markdown.js'

// 保存logo SVG内容
export const LOGO_SVG = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="500px" height="500px" viewBox="0 0 500 500" enable-background="new 0 0 500 500" xml:space="preserve">  <image id="image0" width="500" height="500" x="0" y="0"
    xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAQAAABh3xcBAAAAIGNIUk0AAHolAACAgwAA+f8AAIDp
AAB1MAAA6mAAADqYAAAXb5JfxUYAAAACYktHRAD/h4/MvwAAAAlwSFlzAAAHsQAAB7EBBsVhhgAA
OeNJREFUeNrtnXeAVdW1hz+GOihdEBiK0qtIExQLKiAoYEGwV8SoMTEmmqbJM00TzUt8Jmo0dhAV
EKUIiCgIiEgXFJXeq1KVXt4f4zjtzsy956x91jnnru/+o+Octdc+3t/stvZapTCiT2mqUZVKnER1
qlKNqpxIJU6kAplUoAKZlKcspSlFWUpRFjjMcQ5znKMc5jAHOcg+9rGPb9nLt+xiJ7vYwdfsZRc7
OardQcMvpbQdMDxQk3rUoyb1ySKLapxEdao7+X95nB3s4Gt2spGNrGc7G9jAdu0XYKSKCT0aZFGP
FpxCAxrTgBpUVvRlD9+wjpWsYw1fsoGN2i/HKBkTenhpQCNO5XQa0pwmlNF2pwiOsIKvWMtiVrOK
ddruGIkxoYeLDOrTmSZ0pimNqajtTorsYyXLmcsK5rKeY9ruGLmY0MNBQ5pyDs3pSj1KazsjwFE2
MJuvmMFy1mo7Y5jQtWlJR87mNDpQXtsVRxxkAYuZyXy+0HYlnTGh69Cc7nSkO021HQmQ5UxjPtP4
StuRdMSEHiwNOYNedKGttiOKLOETJjPHpvRBYkIPhjKcxXn0oiOZ2q6EhP3MZzIfMosj2q6kAyZ0
19ThXPpwAfW1HQkp6/mAiUxns7Yj8caE7o5G9KQv51FJ25EIsJcPGc97rNJ2JK6Y0GVqQl/60jnW
YzcM7GE8Y/mQ1dqOxA8TugxVuISB9IpcNFtY2cdkRvIOu7UdiQcmdAn6cC19qartRozZxXiGM1Hb
jehjQvdLS65iIK203Yg5SxnJGxZZ5wcTulfKMoAb6aPtRhoxkVd4k8PabkQTE7oXmnED19JI2400
ZBXDGcoybTeihwk9VfowmMticcMsqhzlbV5ggrYb0cKEnhxVuJ7BtNd2wwBgIc8zzPbkk8WEnhzN
uZUbqa3thpGPLbzCC3YbzpChG8M4xnH7hPJzjFfppv0VMaJOT8apf5XtU/JnHD21vypGVOnLFPUv
sH2S/0yhr/ZXxogaV/Ox+hfXPql/PuZq7a+OERUGMVf9C2sf75+5DNL+ChlhZwCz1L+o9vH/mcUA
7a+SEVb62XQ9Vp+P6af9lTLCRjfGqn8x7SP/GWtHb0YOzXlD/QtpH3efETTX/orpk+4x2yfxEC9z
mrYbhkNaczuVWcg+bUc0SW+h380Ieqb5O0gHStONW9jPHG1H9EjfWPd+PEwbbSeMQPmM3zJO2wkd
MrQdUKE5rzHWZJ52tGEsr6Xnij39pq0VeJARaV0SKb1pw11k2MFdO9s3g2u+o3kMJ7GNaYSdyvfL
7DfVTF95/B+mUeNTJwvZNgAAAAZiS0dEAAAAAAAA+UO7fwAAAAlwSFlzAAALEwAACxMBAJqcGAAA
AW9pVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6
bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuMS4yIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJo
dHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpE
ZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25z
LmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZm
Ok9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6
eG1wbWV0YT4KTMInWQAABTFJREFUeNrt3T1Km1EYhuF3GlFRiR81pDIBVy5C3IiLcQcuwG25AUdT
JLgB02liQBsVRCKJxpLBKAil+Xx5n3Nd/+CnM7eHM3NmJjUBAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMBRtdAByWp2Zqr61+h4v8dYuAUCmqP9a3X/p6jyu7RwA
9OOyFuqpnqur5/FkFwHgf7qKKuq5nup7d3EVh3YVAN5yGot1V2/1Ujd1HnvxYHcB4Hf9+KTu67Vu
6jBO487uAsCvtJiot3qs+zqKY/+mA8BQ9CKOKL36MRmT0dRZdPYeAMaiF0txFrd1Fyt2GwDa6Mcf
8VLnseEsBIC2+nEY39Z/dh0ABuOPeLS7APCn3uO7nQaAwTxgAwD+kKQDQELSDgDJSDoAJCTpAJCQ
pANAQpIOAAlJOgAkJOkAkJCkA0BCkg4ACUk6ACQk6QCQkKQDQEKSDgAJSToAJCTpAJCQpANAQpIO
AAlJOgAkJOkAkJCkA0BCkg4ACUk6ACQk6QCQkKQDQEKSDgAJSToAJCTpAJCQpANAQpIOAAlJOgAk
JOkAkJCkA0BCkg4ACUk6ACQk6QCQkKQDQEKSDgAJSToAJCTpAJCQpANAQpIOAAlJOgAkJOkAkJCk
A0BCkg4ACUk6ACQk6QCQkKQDQEKSDgAJSToAJCTpAJCQpANAQpIOAAlJOgAkJOkAkJCkA0BCkg4A
CUk6ACQk6QCQkKQDQEKSDgAJSToAJCTpAJCQpANAQpIOAAlJOgAkJOkAkJCkA0BCkg4ACUk6ACQk
6QCQkKQDQEKSDgAJSToAJCTpAJCQpANAQpIOAAlJOgAkJOkAkJCkA0BCkg4ACUk6ACQk6QCQkKQD
QEKSDgAJSToAJCTpAJCQpANAQpIOAAlJOgAkJOkAkJCkA0BCkg4ACUk6ACQk6QCQkKQDQEKSDgAJ
SToAJCTpAJCQpANAQpIOAAlJOgAkJOkAkJCkA0BCkg4ACUk6ACQk6QCQkKQDQEKSDgAJSToAJCTp
AJCQpANAQpIOAAlJOgAkJOkAkJCkA0BCkg4ACUk6ACQk6QCQkKQDQEKSDgAJSToAJCTpAJCQpANA
QpIOAAlJOgAkJOkAkJCkA0BCkg4ACUk6ACQk6QCQkKQDQEKSDgAJSToAJCTpAJCQpANAQpIOAAlJ
OgAkJOkAkJCkA0BCkg4ACUk6ACQk6QCQkKQDQEKSDgAJSToAJCTpAJCQpANAQpIOAAlJOgAkJOkA
kJCkA0BCkg4ACUk6ACQk6QCQkKQDQEKSDgAJSToAJCTpAJCQpANAQpIOAAlJOgAkJOkAkJCkA0BC
kg4ACUk6ACQk6QCQkKQDQEKSDgAJSToAJCTpAJCQpANAQpIOAAlJOgAkJOkAkJCkA0BCkg4ACUk6
ACQk6QCQkKQDQEKSDgAJSToAJCTpAJCQpANAQpIOAAlJOgAkJOkAkJCkA0BCkg4ACUk6ACQk6QCQ
kKQDQEKSDgAJSToAJCTpAJCQpANAQpIOAAlJOgAkJOkAkJCkA0BCkg4ACUk6ACQk6QCQkKQDQEKS
DgAJSToAJCTpAJCQpANAQpIOAAlJOgAkJOkAkJCkA0BCkg4ACUk6ACQk6QCQkKQDQELtSGfgPZt1
GTOxHXN2CACGYz6+xlrdxm5cwpSt+QmRImuEkn5dBQAAAABJRU5ErkJggg==" />
</svg> `

// 获取logo的函数
export function getLogo() {
  return LOGO_SVG;
}

// 获取favicon的函数
export function getFavicon() {
  return LOGO_SVG;
}

// 优化HTML模板渲染 - 减少重复代码
export const htmlTemplates = {
  // 错误页面模板
  errorPage(error) {
    return utils.createHtml`
      <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
        <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>
        <div class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
          <p class="text-red-600 dark:text-red-400 font-medium">加载失败</p>
          <p class="text-sm">${error.message}</p>
          <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
        </div>
      </article>
    `
  },
  
  // 404页面模板
  notFoundPage() {
    return utils.createHtml`
      <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
        <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">404</time>
        <div class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
          <p class="font-medium">未找到内容</p>
          <p>您访问的内容不存在或已被删除</p>
          <p class="mt-4"><a href="/" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">返回首页</a></p>
        </div>
      </article>
    `
  },
  
  // 离线页面模板
  offlinePage(siteName) {
    return utils.createHtml`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>离线 - ${siteName || '博客'}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
            color: #333;
            background-color: #f9fafb;
          }
          .container {
            max-width: 500px;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 16px;
            color: #1f2937;
          }
          p {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
            color: #4b5563;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 24px;
            color: #6b7280;
          }
          .btn {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #2563eb;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #111827;
              color: #e5e7eb;
            }
            h1 {
              color: #f9fafb;
            }
            p {
              color: #d1d5db;
            }
            .icon {
              color: #9ca3af;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📶</div>
          <h1>您当前处于离线状态</h1>
          <p>无法加载新内容。请检查您的网络连接并重试。</p>
          <a href="/" class="btn">刷新页面</a>
        </div>
      </body>
      </html>
    `
  },
  
  // 离线图片占位符 - 返回Base64编码的透明像素
  offlineImage() {
    // 提供简单的Base64编码的1x1像素透明PNG作为占位符
    return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  }
}

// 解析导航链接
export function parseNavLinks(linksStr) {
  if (!linksStr) return []
  
  try {
    // 将单引号替换为双引号，以符合 JSON 格式
    const jsonStr = linksStr.replace(/'/g, '"')
    const linksObj = JSON.parse(jsonStr)
    return Object.entries(linksObj).map(([text, url]) => ({ text, url }))
  } catch (error) {
    console.error('解析导航链接失败:', error)
    return []
  }
}

// 渲染单个 memo
export function renderMemo(memo, isHomePage = false) {
  try {
    const timestamp = memo.createTime 
      ? new Date(memo.createTime).getTime()
      : memo.createdTs * 1000
    const date = utils.formatTime(timestamp)
    
    // 提取小时和分钟
    const dateObj = new Date(timestamp)
    const hours = dateObj.getHours().toString().padStart(2, '0')
    const minutes = dateObj.getMinutes().toString().padStart(2, '0')
    const timeStr = `${hours}:${minutes}`
    
    // 使用简易Markdown渲染内容
    const content = memo.content || ''
    const parsedContent = simpleMarkdown(content)
    
    // 资源处理 - 图片预览优化
    const resources = memo.resources || memo.resourceList || []
    let resourcesHtml = ''
    
    if (resources.length > 0) {
      // 使用单列布局
      resourcesHtml = utils.createHtml`
        <div class="mt-4">
          ${resources.map(resource => utils.createHtml`
            <div class="mb-4 last:mb-0">
              <img 
                src="${resource.externalLink || ''}" 
                alt="${resource.filename || '图片'}"
                class="rounded-lg max-w-full hover:opacity-95 transition-opacity"
                loading="lazy"
              />
            </div>
          `).join('')}
        </div>
      `
    }
    
    // 文章URL
    const articleUrl = isHomePage ? `/post/${memo.name}` : '#'
    
    // 使用时间轴样式渲染
    return utils.createHtml`
      <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
        <a href="${articleUrl}" class="block">
          <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">${timeStr}</time>
        </a>
        <div class="text-gray-700 dark:text-gray-300 leading-relaxed mt-1 md:text-base text-sm article-content">
          ${parsedContent}
          ${resourcesHtml}
        </div>
      </article>
    `
  } catch (error) {
    console.error('渲染 memo 失败:', error)
    return utils.createHtml`
      <article class="pb-6 border-l border-indigo-300 relative pl-5 ml-3 last:border-0 last:pb-0">
        <time class="text-indigo-600 dark:text-indigo-400 font-poppins font-semibold block md:text-sm text-xs">错误</time>
        <div class="text-red-500 dark:text-red-400 leading-relaxed mt-1 md:text-base text-sm">
          <p>渲染失败: ${error.message}</p>
        </div>
      </article>
    `
  }
}

// 渲染基础 HTML - 使用index.html作为模板
export function renderBaseHtml(title, content, footerText, navLinks, siteName) {
  // 解析导航链接
  const navItems = parseNavLinks(navLinks)

  // 导航链接HTML
  const navItemsHtml = navItems.length > 0 
    ? navItems.map(item => utils.createHtml`
        <li><a href="${item.url}" class="nav-link">${item.text}</a></li>
      `).join('')
    : '';
  
  // 创建文章HTML - 针对首页模式下的多条memo
  let articlesHtml = '';
  if (Array.isArray(content)) {
    articlesHtml = content.join('');
  } else {
    articlesHtml = content;
  }

  // 返回基于index.html模板的HTML
  return utils.createHtml`
    <!DOCTYPE html>
    <html lang="zh-CN" class="scroll-smooth">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500&family=Roboto&display=swap" rel="stylesheet">
      <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet">
      <link rel="icon" href="/favicon.ico" type="image/svg+xml">
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          darkMode: 'class',
          theme: {
            extend: {
              backgroundImage: {
                'custom-gradient': 'linear-gradient(45deg, #209cff, #68e0cf)',
                'custom-gradient-dark': 'linear-gradient(45deg, #0f4c81, #2c7873)',
              },
              colors: {
                'indigo-timeline': '#4e5ed3',
                'indigo-shadow': '#bab5f8',
              },
            }
          }
        }
      </script>
      <style type="text/tailwindcss">
        @layer utilities {
          article::before {
            @apply content-[''] w-[17px] h-[17px] bg-white border border-indigo-timeline rounded-full absolute -left-[10px] top-0;
            box-shadow: 3px 3px 0px #bab5f8;
          }
          .dark article::before {
            @apply bg-gray-800 border-indigo-400;
            box-shadow: 3px 3px 0px #6366f1;
          }
          article:last-child {
            @apply border-transparent;
          }
          .nav-link {
            @apply px-3 py-1.5 rounded-md transition-colors text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 text-sm font-medium;
          }
          .article-content p {
            line-height: 1.5;
            margin-top: 5px;
            margin-bottom: 15px;
          }
          .container {
            @apply w-full mx-auto;
            max-width: 640px;
          }
          
          @media (max-width: 640px) {
            .header-container {
              @apply flex-col items-start;
            }
            .header-container h1 {
              @apply mb-4;
            }
            .header-right {
              @apply w-full justify-between mt-2;
            }
          }
        }
      </style>
      <!-- 使用常规CSS避免循环依赖 -->
      <style>
        .back-to-top {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background-color: rgba(224, 231, 255, 1);
          color: rgb(79, 70, 229);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          z-index: 50;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        
        .dark .back-to-top {
          background-color: rgba(79, 70, 229, 0.2);
          color: rgb(199, 210, 254);
        }
        
        .back-to-top:hover {
          background-color: rgba(199, 210, 254, 1);
          color: rgb(67, 56, 202);
          transform: translateY(-2px);
        }
        
        .dark .back-to-top:hover {
          background-color: rgba(79, 70, 229, 0.4);
          color: rgb(224, 231, 255);
        }
        
        .back-to-top.visible {
          opacity: 1;
          visibility: visible;
        }
      </style>
    </head>
    <body class="min-h-screen bg-custom-gradient dark:bg-custom-gradient-dark bg-fixed m-0 p-0 font-sans">
      <div class="container px-4 py-12 sm:px-4 sm:py-12 px-[10px] py-[20px]">
        <div class="bg-blue-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full sm:p-8 p-[15px]">
          <header class="flex items-center justify-between sm:flex-row flex-row">
            <div class="flex items-center">
              <a href="/" class="flex items-center">
                <img src="/logo.svg" alt="${siteName}Logo" class="w-8 h-8 mr-2" width="32" height="32">
                <h1 class="text-xl md:text-lg font-semibold font-poppins text-gray-800 dark:text-gray-100 mb-0 tracking-wide">${siteName || '归零杂记'}</h1>
              </a>
            </div>
            <div class="flex items-center space-x-4">
              <nav class="mr-1">
                <ul class="flex space-x-2">
                  ${navItemsHtml || `
                    <li><a href="/" class="nav-link">首页</a></li>
                    <li><a href="#" class="nav-link">归档</a></li>
                    <li><a href="#" class="nav-link">关于</a></li>
                  `}
                </ul>
              </nav>
              <button id="theme-toggle" class="w-9 h-9 flex items-center justify-center rounded-full bg-indigo-100/80 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 text-indigo-500 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 focus:outline-none transition-colors shadow-sm">
                <i class="ri-sun-fill text-lg" id="theme-icon"></i>
              </button>
            </div>
          </header>
          <main class="mt-8 relative">
            ${articlesHtml}
          </main>
        </div>
      </div>

      <div id="back-to-top" class="back-to-top">
        <i class="ri-arrow-up-fill text-xl"></i>
      </div>

      <script>
        // 主题切换功能
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');
        const html = document.documentElement;
        
        // 主题模式
        const themes = ['system', 'light', 'dark'];
        let currentTheme = 0; // 默认跟随系统
        
        // 更新图标
        function updateIcon(theme) {
          if (theme === 'light') {
            themeIcon.className = 'ri-sun-fill text-lg';
          } else if (theme === 'dark') {
            themeIcon.className = 'ri-moon-fill text-lg';
          } else {
            themeIcon.className = 'ri-computer-fill text-lg';
          }
        }
        
        // 初始化主题
        function applyTheme(theme) {
          if (theme === 'light') {
            html.classList.remove('dark');
            localStorage.theme = 'light';
          } else if (theme === 'dark') {
            html.classList.add('dark');
            localStorage.theme = 'dark';
          } else {
            // 跟随系统
            localStorage.removeItem('theme');
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
              html.classList.add('dark');
            } else {
              html.classList.remove('dark');
            }
          }
          updateIcon(theme);
        }
        
        // 检查本地存储的主题
        if (localStorage.theme === 'dark') {
          html.classList.add('dark');
          currentTheme = 2; // dark
          updateIcon('dark');
        } else if (localStorage.theme === 'light') {
          html.classList.remove('dark');
          currentTheme = 1; // light
          updateIcon('light');
        } else {
          // 跟随系统
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            html.classList.add('dark');
          }
          updateIcon('system');
        }
        
        // 点击切换主题
        themeToggle.addEventListener('click', () => {
          currentTheme = (currentTheme + 1) % 3;
          const newTheme = themes[currentTheme];
          applyTheme(newTheme);
        });
        
        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
          if (!localStorage.theme) { // 只在跟随系统模式下响应
            if (e.matches) {
              html.classList.add('dark');
            } else {
              html.classList.remove('dark');
            }
          }
        });

        // 返回顶部功能
        const backToTop = document.getElementById('back-to-top');
        
        // 监听滚动事件
        window.addEventListener('scroll', () => {
          if (window.scrollY > 300) {
            backToTop.classList.add('visible');
          } else {
            backToTop.classList.remove('visible');
          }
        });
        
        // 点击返回顶部
        backToTop.addEventListener('click', () => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });

        // 检查初始滚动位置
        if (window.scrollY > 300) {
          backToTop.classList.add('visible');
        }
      </script>
    </body>
    </html>
  `;
} 