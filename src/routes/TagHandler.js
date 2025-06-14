import { BaseHandler } from './BaseHandler.js'
import { MemoService } from '../services/MemoService.js'
import { MemoCard } from '../components/MemoCard.js'
import { utils } from '../utils.js'

export class TagHandler extends BaseHandler {
  constructor(c) {
    super(c)
    this.memoService = new MemoService()
  }

  async handle() {
    try {
      // 获取标签参数
      const tag = this.c.req.param('tag')
      if (!tag) {
        return this.renderNotFoundPage()
      }

      // 获取当前页码
      const url = new URL(this.c.req.url)
      const pageParam = url.searchParams.get('page')
      const currentPage = pageParam ? parseInt(pageParam) : 1

      // 获取指定标签和页的数据
      const memos = await this.memoService.fetchMemos(this.env, tag, currentPage)
      console.log('获取到标签 memos 数量:', memos.length)

      // 如果没有数据且不是第一页，返回404
      if (memos.length === 0 && currentPage > 1) {
        return this.renderNotFoundPage()
      }

      // 按时间降序排序 memos
      const sortedMemos = utils.sortMemosByTime(memos)
      const memosHtml = sortedMemos.map(memo => MemoCard(memo, true))
      
      // 判断是否有更多数据
      const hasMore = memos.length >= this.config.pageLimit

      return this.renderBasePage({
        title: `标签: ${tag} - ${this.config.siteName}`,
        content: memosHtml,
        currentPage,
        hasMore,
        tag
      })
    } catch (error) {
      console.error('渲染标签页失败:', error)
      return this.renderErrorPage(error)
    }
  }
} 