import { BaseHandler } from './BaseHandler.js'
import { MemoService } from '../services/MemoService.js'
import { MemoCard } from '../components/MemoCard.js'
import { utils } from '../utils.js'

export class PageHandler extends BaseHandler {
  constructor(c) {
    super(c)
    this.memoService = new MemoService()
  }

  async handle() {
    try {
      // 获取页码参数
      const pageNumber = parseInt(this.c.req.param('number'))
      if (isNaN(pageNumber) || pageNumber < 1) {
        return this.renderNotFoundPage()
      }
      
      // 获取指定页的数据
      const memos = await this.memoService.fetchMemos(this.env, '', pageNumber)
      console.log('获取到页面 memos 数量:', memos.length)

      // 如果没有数据且不是第一页，返回404
      if (memos.length === 0 && pageNumber > 1) {
        return this.renderNotFoundPage()
      }

      // 按时间降序排序 memos
      const sortedMemos = utils.sortMemosByTime(memos)
      const memosHtml = sortedMemos.map(memo => MemoCard(memo, true))
      
      // 判断是否有更多数据
      const hasMore = memos.length >= this.config.pageLimit

      return this.renderBasePage({
        title: `第 ${pageNumber} 页 - ${this.config.siteName}`,
        content: memosHtml,
        currentPage: pageNumber,
        hasMore
      })
    } catch (error) {
      console.error('渲染分页失败:', error)
      return this.renderErrorPage(error)
    }
  }
} 