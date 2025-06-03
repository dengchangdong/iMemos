import { utils } from './utils'

export const htmlTemplates = {
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
    `;
  },
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
    `;
  }
}; 