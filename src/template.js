import { html } from 'hono/html'
import { CONFIG } from './config.js'
import { utils } from './utils.js'
import { simpleMarkdown } from './markdown.js'

// 优化HTML模板渲染 - 减少重复代码
export const htmlTemplates = {
  // 错误页面模板
  errorPage(error) {
    return utils.createHtml`
      <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-lg">
        <h2 class="text-lg font-semibold mb-2">加载失败</h2>
        <p class="text-sm">${error.message}</p>
        <a href="/" class="inline-flex items-center mt-4 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
          <i class="ti ti-arrow-left mr-1"></i>
          返回首页
        </a>
      </div>
    `
  },
  
  // 404页面模板
  notFoundPage() {
    return utils.createHtml`
      <div class="text-center py-12">
        <i class="ti ti-alert-circle text-5xl text-gray-400 mb-4"></i>
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">未找到内容</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">您访问的内容不存在或已被删除</p>
        <a href="/" class="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          <i class="ti ti-arrow-left mr-1"></i>
          返回首页
        </a>
      </div>
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
    
    // 使用简易Markdown渲染内容
    const content = memo.content || ''
    const parsedContent = simpleMarkdown(content)
    
    // 资源处理 - 图片预览优化
    const resources = memo.resources || memo.resourceList || []
    let resourcesHtml = ''
    
    if (resources.length > 0) {
      // 优化布局类选择逻辑
      const gridCols = resources.length === 1 ? 'grid-cols-1' : 
                      resources.length === 2 ? 'grid-cols-2' : 
                      'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
      
      // 使用模板字符串生成HTML
      resourcesHtml = utils.createHtml`
        <div class="grid ${gridCols} gap-4 mt-4">
          ${resources.map(resource => utils.createHtml`
            <div class="group relative aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 cursor-pointer" onclick="showImage(this.querySelector('img'))">
              <img 
                src="${resource.externalLink || ''}" 
                alt="${resource.filename || '图片'}"
                class="absolute inset-0 w-full h-full object-cover rounded-md"
                loading="lazy"
                data-preview="true"
              />
            </div>
          `).join('')}
        </div>
      `
    }
    
    // 根据页面类型生成时间HTML
    const timeHtml = isHomePage 
      ? utils.createHtml`<time class="text-sm text-gray-500 dark:text-gray-400">
           <a href="/post/${memo.name}" class="hover:text-gray-700 dark:hover:text-gray-300">
             ${date}
           </a>
         </time>`
      : utils.createHtml`<time class="text-sm text-gray-500 dark:text-gray-400">${date}</time>`
    
    // 组合最终HTML
    return utils.createHtml`
      <article class="mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
        ${timeHtml}
        <div class="mt-2 memo-content">
          ${parsedContent}
        </div>
        ${resourcesHtml}
      </article>
    `
  } catch (error) {
    console.error('渲染 memo 失败:', error)
    return utils.createHtml`
      <div class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        <p class="font-medium">渲染失败</p>
        <p class="text-sm mt-1">${error.message}</p>
      </div>
    `
  }
}

// 渲染基础 HTML - 优化CSS加载和脚本处理
export function renderBaseHtml(title, content, footerText, navLinks, siteName) {
  // 解析导航链接
  const navItems = parseNavLinks(navLinks)

  // 导航链接HTML
  const navHtml = navItems.length > 0 
    ? utils.createHtml`
      <div class="flex flex-wrap gap-4 mt-4">
        ${navItems.map(item => utils.createHtml`
          <a href="${item.url}" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            ${item.text}
          </a>
        `).join('')}
      </div>
    ` : ''

  return utils.createHtml`
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                fontFamily: {
                  sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
                  mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
                },
                colors: {
                  primary: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                  },
                }
              },
            },
          }
        </script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
          }
          
          .memo-content p {
            margin-bottom: 1rem;
          }
          
          .memo-content a {
            color: #0969da;
            text-decoration: none;
          }
          
          .memo-content a:hover {
            text-decoration: underline;
          }

          .memo-content code {
            font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            background-color: rgba(175, 184, 193, 0.2);
            padding: 0.2em 0.4em;
            border-radius: 6px;
            font-size: 85%;
          }
          
          .memo-content pre {
            background-color: #f6f8fa;
            border-radius: 6px;
            padding: 16px;
            overflow: auto;
            margin-bottom: 16px;
          }
          
          .dark .memo-content pre {
            background-color: #161b22;
          }
          
          .dark .memo-content code {
            background-color: rgba(110, 118, 129, 0.4);
          }
          
          .dark .memo-content a {
            color: #58a6ff;
          }
          
          .theme-btn {
            position: relative;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .theme-btn:hover {
            background: rgba(0, 0, 0, 0.05);
          }
          
          .dark .theme-btn:hover {
            background: rgba(255, 255, 255, 0.1);
          }
          
          .theme-btn i {
            font-size: 1.25rem;
            transition: all 0.3s ease;
          }
          
          .theme-btn[data-theme="system"] i.ti-device-desktop,
          .theme-btn[data-theme="light"] i.ti-sun,
          .theme-btn[data-theme="dark"] i.ti-moon {
            opacity: 1;
          }
          
          .theme-btn i.ti-device-desktop,
          .theme-btn i.ti-sun,
          .theme-btn i.ti-moon {
            opacity: 0;
            position: absolute;
          }
          
          .back-to-top {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(0, 0, 0, 0.1);
            color: #374151;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
            z-index: 40;
          }
          
          .back-to-top.visible {
            opacity: 1;
            transform: translateY(0);
          }
          
          .back-to-top:hover {
            background: rgba(255, 255, 255, 0.9);
            transform: translateY(-2px);
          }
          
          .dark .back-to-top {
            background: rgba(17, 24, 39, 0.8);
            border-color: rgba(255, 255, 255, 0.1);
            color: #E5E7EB;
          }
          
          .dark .back-to-top:hover {
            background: rgba(17, 24, 39, 0.9);
          }
          
          .footer-divider {
            height: 1px;
            background: rgba(0, 0, 0, 0.1);
          }
          
          .dark .footer-divider {
            background: rgba(255, 255, 255, 0.1);
          }
        </style>
      </head>
      <body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col">
        <div class="flex-grow">
          <div class="max-w-2xl mx-auto px-4 py-8">
            <header class="mb-8">
              <h1 class="text-2xl font-bold">
                <a href="/" class="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  ${siteName}
                </a>
              </h1>
              ${navHtml}
              <div class="flex justify-end mt-4">
                <button class="theme-btn" data-theme="system">
                  <i class="ti ti-device-desktop"></i>
                  <i class="ti ti-sun"></i>
                  <i class="ti ti-moon"></i>
                </button>
              </div>
            </header>
            <main class="space-y-8">
              ${content}
            </main>
          </div>
        </div>

        <footer class="mt-12">
          <div class="max-w-2xl mx-auto px-4 py-6">
            <div class="footer-divider mb-6"></div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              <p>${footerText}</p>
              <p class="mt-2">
                <a href="#" id="backToTop" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  返回顶部
                </a>
              </p>
            </div>
          </div>
        </footer>

        <script>
          // 主题切换
          const themeBtn = document.querySelector('.theme-btn')
          const html = document.documentElement
          
          // 从 localStorage 获取保存的主题
          const savedTheme = localStorage.getItem('theme') || 'system'
          setTheme(savedTheme)
          
          themeBtn.addEventListener('click', () => {
            const currentTheme = themeBtn.dataset.theme
            let nextTheme
            
            switch(currentTheme) {
              case 'system':
                nextTheme = 'light'
                break
              case 'light':
                nextTheme = 'dark'
                break
              case 'dark':
                nextTheme = 'system'
                break
            }
            
            setTheme(nextTheme)
            localStorage.setItem('theme', nextTheme)
          })
          
          function setTheme(theme) {
            themeBtn.dataset.theme = theme
            
            if (theme === 'system') {
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
              html.classList.toggle('dark', prefersDark)
            } else {
              html.classList.toggle('dark', theme === 'dark')
            }
          }

          // 监听系统主题变化
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (themeBtn.dataset.theme === 'system') {
              html.classList.toggle('dark', e.matches)
            }
          })

          // 返回顶部
          const backToTop = document.getElementById('backToTop')
          
          backToTop.addEventListener('click', (e) => {
            e.preventDefault()
            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            })
          })

          // 图片预览功能 - 简化实现
          window.showImage = function(img) {
            if (!img) return
            
            const modal = document.createElement('div')
            modal.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center'
            modal.style.display = 'flex'
            
            const modalContent = document.createElement('div')
            modalContent.className = 'relative max-w-[90%] max-h-[90%]'
            
            const modalImg = document.createElement('img')
            modalImg.src = img.src
            modalImg.className = 'max-w-full max-h-[90vh] object-contain rounded-lg'
            
            const closeBtn = document.createElement('button')
            closeBtn.className = 'absolute -top-12 right-0 text-white text-2xl cursor-pointer bg-gray-800 hover:bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center transition-colors'
            closeBtn.innerHTML = '<i class="ti ti-x"></i>'
            
            modalContent.appendChild(modalImg)
            modalContent.appendChild(closeBtn)
            modal.appendChild(modalContent)
            document.body.appendChild(modal)
            
            // 禁止背景滚动
            document.body.style.overflow = 'hidden'
            
            // 关闭模态框
            function closeModal() {
              modal.remove()
              document.body.style.overflow = ''
            }
            
            closeBtn.addEventListener('click', closeModal)
            
            modal.addEventListener('click', (e) => {
              if (e.target === modal) {
                closeModal()
              }
            })
            
            // 键盘事件
            document.addEventListener('keydown', function(e) {
              if (e.key === 'Escape') {
                closeModal()
              }
            })
          }
        </script>
      </body>
    </html>
  `
} 