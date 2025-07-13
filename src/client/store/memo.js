import { defineStore } from 'pinia';
import { useConfigStore } from './config';

export const useMemoStore = defineStore('memo', {
  state: () => ({
    memos: [],
    memo: null,
    loading: false,
    error: null,
    currentPage: 1,
    hasMore: false,
    currentTag: ''
  }),
  
  getters: {
    sortedMemos(state) {
      return [...state.memos].sort((a, b) => {
        const timeA = a.createTime ? new Date(a.createTime).getTime() : a.createdTs * 1000;
        const timeB = b.createTime ? new Date(b.createTime).getTime() : b.createdTs * 1000;
        return timeB - timeA; // 降序排列，最新的在前面
      });
    }
  },
  
  actions: {
    async fetchMemos(page = 1, tag = '') {
      this.loading = true;
      this.error = null;
      this.currentPage = page;
      this.currentTag = tag;
      
      try {
        const configStore = useConfigStore();
        const limit = configStore.pageLimit;
        const offset = (page - 1) * limit;
        const apiHost = configStore.apiHost;
        
        const response = await fetch(
          `${apiHost}/api/v1/memo?rowStatus=NORMAL&creatorId=1&tag=${tag}&limit=${limit}&offset=${offset}`
        );
        
        if (!response.ok) {
          throw new Error(`API 请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        this.memos = data;
        this.hasMore = data.length >= limit;
      } catch (error) {
        console.error('获取 memos 数据失败:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    async fetchMemo(id) {
      this.loading = true;
      this.error = null;
      this.memo = null;
      
      try {
        const configStore = useConfigStore();
        const apiHost = configStore.apiHost;
        
        const response = await fetch(`${apiHost}/api/v2/memos/${id}`);
        
        if (!response.ok) {
          throw new Error(`API 请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        this.memo = data;
      } catch (error) {
        console.error('获取单条 memo 数据失败:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    }
  }
}); 