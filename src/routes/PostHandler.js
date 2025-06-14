import { BaseHandler } from './BaseHandler.js'
import { MemoService } from '../services/MemoService.js'
import { MemoCard } from '../components/MemoCard.js'

export class PostHandler extends BaseHandler {
  constructor(c) {
    super(c)
    this.memoService = new MemoService()
  }

  async handle() {
    try {
      // 获取文章名称
      const name = this.c.req.param('name')
      if (!name) {
        return this.renderNotFoundPage()
      }

      // 获取文章数据
      const memo = await this.memoService.fetchMemo(this.env, name)
      if (!memo) {
        return this.renderNotFoundPage()
      }

      // 渲染文章内容
      const content = MemoCard(memo)

      return this.renderBasePage({
        title: `${memo.content?.slice(0, 50) || '文章'} - ${this.config.siteName}`,
        content
      })
    } catch (error) {
      console.error('渲染文章详情页失败:', error)
      return this.renderErrorPage(error)
    }
  }
} 