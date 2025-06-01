import { Hono } from 'hono'

const app = new Hono()

// 错误处理中间件
app.use('*', async (c, next) => {
  try {
    await next()
  } catch (err) {
    console.error('错误:', err)
    return c.text('服务器错误', 500)
  }
})

// 渲染单个 memo
function renderMemo(memo) {
  try {
    const date = memo.createTime 
      ? new Date(memo.createTime).toLocaleString('zh-CN')
      : new Date(memo.createdTs * 1000).toLocaleString('zh-CN')
    
    const content = memo.content || ''
    const resources = memo.resources || memo.resourceList || []
    
    let resourcesHtml = ''
    if (resources.length > 0) {
      resourcesHtml = `
        <div class="image-grid">
          ${resources.map(resource => `
            <div class="image-container">
              <img 
                src="${resource.externalLink || ''}" 
                alt="${resource.filename || '图片'}"
                loading="lazy"
              />
            </div>
          `).join('')}
        </div>
      `
    }
    
    return `
      <div class="memo-card">
        <div class="memo-date">${date}</div>
        <div class="memo-content">${content}</div>
        ${resourcesHtml}
      </div>
    `
  } catch (error) {
    console.error('渲染 memo 失败:', error)
    return `
      <div class="error-container">
        <div class="error-title">渲染失败</div>
        <div class="error-message">${error.message}</div>
      </div>
    `
  }
}

// 渲染基础 HTML
function renderBaseHtml(title, content) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          :root {
            --primary-color: #0066cc;
            --text-color: #333;
            --bg-color: #fff;
            --card-bg: #fff;
            --border-color: #eee;
            --hover-color: #f8f9fa;
          }

          [data-theme="dark"] {
            --primary-color: #3b82f6;
            --text-color: #e5e7eb;
            --bg-color: #111827;
            --card-bg: #1f2937;
            --border-color: #374151;
            --hover-color: #2d3748;
          }

          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background: var(--bg-color);
            color: var(--text-color);
            transition: background-color 0.3s ease, color 0.3s ease;
          }

          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem 1rem;
          }

          header {
            margin-bottom: 3rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .theme-switcher {
            display: flex;
            gap: 0.5rem;
            align-items: center;
          }

          .theme-btn {
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            background: var(--card-bg);
            color: var(--text-color);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .theme-btn:hover {
            background: var(--hover-color);
          }

          .theme-btn.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
          }

          h1 {
            margin: 0;
            font-size: 2rem;
            font-weight: 700;
          }

          a {
            color: var(--primary-color);
            text-decoration: none;
            transition: color 0.2s ease;
          }

          a:hover {
            color: var(--primary-color);
            text-decoration: underline;
          }

          .memo-card {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: var(--card-bg);
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .memo-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }

          .memo-date {
            color: #666;
            font-size: 0.875rem;
            margin-bottom: 1rem;
          }

          .memo-content {
            font-size: 1rem;
            line-height: 1.7;
            margin-bottom: 1rem;
          }

          .memo-link {
            display: inline-block;
            color: #666;
            font-size: 0.875rem;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            background: var(--hover-color);
            transition: background-color 0.2s ease;
          }

          .memo-link:hover {
            background: var(--border-color);
            text-decoration: none;
          }

          .image-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
          }

          .image-container {
            position: relative;
            padding-bottom: 100%;
            overflow: hidden;
            border-radius: 8px;
            background: var(--hover-color);
            cursor: pointer;
          }

          .image-container img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }

          .image-container:hover img {
            transform: scale(1.05);
          }

          .error-container {
            text-align: center;
            padding: 3rem 1rem;
          }

          .error-title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #dc2626;
          }

          .error-message {
            color: #666;
            margin-bottom: 1.5rem;
          }

          .back-link {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: var(--primary-color);
            color: white;
            border-radius: 6px;
            transition: background-color 0.2s ease;
          }

          .back-link:hover {
            background: var(--primary-color);
            opacity: 0.9;
            text-decoration: none;
          }

          /* 图片预览模态框 */
          .image-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .image-modal.active {
            display: flex;
            opacity: 1;
          }

          .image-modal-content {
            max-width: 90%;
            max-height: 90%;
            margin: auto;
            position: relative;
          }

          .image-modal-content img {
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
          }

          .image-modal-close {
            position: absolute;
            top: -40px;
            right: 0;
            color: white;
            font-size: 2rem;
            cursor: pointer;
            padding: 0.5rem;
          }

          .image-modal-prev,
          .image-modal-next {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            color: white;
            font-size: 2rem;
            cursor: pointer;
            padding: 1rem;
            user-select: none;
          }

          .image-modal-prev {
            left: -60px;
          }

          .image-modal-next {
            right: -60px;
          }

          @media (max-width: 768px) {
            .image-modal-prev {
              left: 10px;
            }
            .image-modal-next {
              right: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1><a href="/">${title}</a></h1>
            <div class="theme-switcher">
              <button class="theme-btn" data-theme="system">🌓</button>
              <button class="theme-btn" data-theme="light">☀️</button>
              <button class="theme-btn" data-theme="dark">🌙</button>
            </div>
          </header>
          <main>
            ${content}
          </main>
        </div>

        <!-- 图片预览模态框 -->
        <div class="image-modal" id="imageModal">
          <div class="image-modal-content">
            <span class="image-modal-close">&times;</span>
            <img src="" alt="预览图片">
            <div class="image-modal-prev">❮</div>
            <div class="image-modal-next">❯</div>
          </div>
        </div>

        <script>
          // 主题切换
          const themeBtns = document.querySelectorAll('.theme-btn');
          const html = document.documentElement;
          
          // 从 localStorage 获取保存的主题
          const savedTheme = localStorage.getItem('theme') || 'system';
          setTheme(savedTheme);
          
          themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
              const theme = btn.dataset.theme;
              setTheme(theme);
              localStorage.setItem('theme', theme);
            });
          });
          
          function setTheme(theme) {
            // 移除所有主题按钮的 active 类
            themeBtns.forEach(btn => btn.classList.remove('active'));
            
            // 为当前主题按钮添加 active 类
            const activeBtn = document.querySelector(\`[data-theme="\${theme}"]\`);
            if (activeBtn) {
              activeBtn.classList.add('active');
            }
            
            if (theme === 'system') {
              // 移除 data-theme 属性，使用系统主题
              html.removeAttribute('data-theme');
              // 监听系统主题变化
              if (window.matchMedia) {
                const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                darkModeMediaQuery.addListener((e) => {
                  html.removeAttribute('data-theme');
                });
              }
            } else {
              // 设置指定的主题
              html.setAttribute('data-theme', theme);
            }
          }

          // 图片预览
          const modal = document.getElementById('imageModal');
          const modalImg = modal.querySelector('img');
          const closeBtn = modal.querySelector('.image-modal-close');
          const prevBtn = modal.querySelector('.image-modal-prev');
          const nextBtn = modal.querySelector('.image-modal-next');
          
          let currentImageIndex = 0;
          let images = [];
          
          // 为所有图片添加点击事件
          document.addEventListener('click', (e) => {
            const imageContainer = e.target.closest('.image-container');
            if (imageContainer) {
              const img = imageContainer.querySelector('img');
              if (img) {
                // 获取当前页面所有图片
                images = Array.from(document.querySelectorAll('.image-container img')).map(img => img.src);
                currentImageIndex = images.indexOf(img.src);
                openModal(img.src);
              }
            }
          });
          
          function openModal(src) {
            modalImg.src = src;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
          }
          
          function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
          }
          
          function showImage(index) {
            if (index < 0) index = images.length - 1;
            if (index >= images.length) index = 0;
            currentImageIndex = index;
            modalImg.src = images[currentImageIndex];
          }
          
          closeBtn.addEventListener('click', closeModal);
          prevBtn.addEventListener('click', () => showImage(currentImageIndex - 1));
          nextBtn.addEventListener('click', () => showImage(currentImageIndex + 1));
          
          // 点击模态框背景关闭
          modal.addEventListener('click', (e) => {
            if (e.target === modal) {
              closeModal();
            }
          });
          
          // 键盘导航
          document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('active')) return;
            
            switch(e.key) {
              case 'Escape':
                closeModal();
                break;
              case 'ArrowLeft':
                showImage(currentImageIndex - 1);
                break;
              case 'ArrowRight':
                showImage(currentImageIndex + 1);
                break;
            }
          });
        </script>
      </body>
    </html>
  `
}

// 主页路由
app.get('/', async (c) => {
  try {
    const limit = c.env.PAGE_LIMIT || '10'
    const apiUrl = `${c.env.API_HOST}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=&limit=${limit}&offset=0`
    console.log('请求 API:', apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const memos = await response.json()
    console.log('获取到 memos 数量:', memos.length)

    const memosHtml = memos.map(memo => {
      const memoHtml = renderMemo(memo)
      return `
        <div style="margin-bottom: 2rem;">
          ${memoHtml}
          <div style="text-align: right;">
            <a href="/post/${memo.name}" class="memo-link">查看详情</a>
          </div>
        </div>
      `
    }).join('')

    return new Response(renderBaseHtml(c.env.SITE_NAME, memosHtml), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  } catch (error) {
    console.error('渲染页面失败:', error)
    return new Response(renderBaseHtml('错误', `
      <div class="error-container">
        <div class="error-title">加载失败</div>
        <div class="error-message">${error.message}</div>
        <a href="/" class="back-link">返回首页</a>
      </div>
    `), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  }
})

// 单页路由
app.get('/post/:name', async (c) => {
  try {
    const name = c.req.param('name')
    const apiUrl = `${c.env.API_HOST}/api/v2/memos/${name}`
    console.log('请求 API:', apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    if (!data || !data.memo) {
      return new Response(renderBaseHtml('未找到内容', `
        <div class="error-container">
          <div class="error-title">未找到内容</div>
          <div class="error-message">您访问的内容不存在或已被删除</div>
          <a href="/" class="back-link">返回首页</a>
        </div>
      `), {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8'
        }
      })
    }

    const memo = data.memo
    const memoHtml = renderMemo(memo)
    const title = memo.content ? (memo.content.substring(0, 50) + (memo.content.length > 50 ? '...' : '')) : '无标题'

    return new Response(renderBaseHtml(title, memoHtml), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  } catch (error) {
    console.error('渲染页面失败:', error)
    return new Response(renderBaseHtml('加载失败', `
      <div class="error-container">
        <div class="error-title">加载失败</div>
        <div class="error-message">${error.message}</div>
        <a href="/" class="back-link">返回首页</a>
      </div>
    `), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    })
  }
})

export default app 