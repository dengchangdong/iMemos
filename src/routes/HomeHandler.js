import { BaseHandler } from './BaseHandler.js'
import { MemoService } from '../services/MemoService.js'
import { MemoCard } from '../components/MemoCard.js'
import { utils } from '../utils.js'

export class HomeHandler extends BaseHandler {
  constructor(c) {
    super(c)
    this.memoService = new MemoService()
  }

  async handle() {
    try {
      // 获取当前页码
      const url = new URL(this.c.req.url)
      const pageParam = url.searchParams.get('page')
      const currentPage = pageParam ? parseInt(pageParam) : 1
      
      // 获取指定页的数据
      const memos = await this.memoService.fetchMemos(this.env, '', currentPage)
      console.log('获取到 memos 数量:', memos.length)

      // 按时间降序排序 memos
      const sortedMemos = utils.sortMemosByTime(memos)
      const memosHtml = sortedMemos.map(memo => MemoCard(memo, true))
      
      // 判断是否有更多数据
      const hasMore = memos.length >= this.config.pageLimit

      return this.renderBasePage({
        title: this.config.siteName,
        content: memosHtml,
        currentPage,
        hasMore,
        isHomePage: true
      })
    } catch (error) {
      console.error('渲染首页失败:', error)
      return this.renderErrorPage(error)
    }
  }
} 