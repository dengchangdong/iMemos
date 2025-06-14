import { BaseLayout } from '../layouts/BaseLayout.js'
import { ErrorPage } from '../components/ErrorPage.js'
import { NotFoundPage } from '../components/NotFoundPage.js'

export class BaseHandler {
  constructor(c) {
    this.c = c
    this.env = c.env
    this.config = {
      pageLimit: this.env.PAGE_LIMIT || 10,
      siteName: this.env.SITE_NAME || '博客',
      navLinks: this.env.NAV_LINKS || '{}'
    }
  }

  // 创建响应
  createResponse(html, cacheTime = 300, status = 200) {
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': `public, max-age=${cacheTime}`
      },
      status
    })
  }

  // 渲染错误页面
  renderErrorPage(error) {
    const content = ErrorPage(error)
    const html = BaseLayout({
      title: '错误',
      content,
      navLinks: this.config.navLinks,
      siteName: this.config.siteName
    })
    return this.createResponse(html, 300, 500)
  }

  // 渲染404页面
  renderNotFoundPage() {
    const content = NotFoundPage()
    const html = BaseLayout({
      title: this.config.siteName,
      content,
      navLinks: this.config.navLinks,
      siteName: this.config.siteName
    })
    return this.createResponse(html, 300, 404)
  }

  // 渲染基础页面
  renderBasePage({ title, content, currentPage = 1, hasMore = false, isHomePage = false, tag = '' }) {
    const html = BaseLayout({
      title,
      content,
      navLinks: this.config.navLinks,
      siteName: this.config.siteName,
      currentPage,
      hasMore,
      isHomePage,
      tag
    })
    return this.createResponse(html)
  }
} 