import { defineStore } from 'pinia';

export const useConfigStore = defineStore('config', {
  state: () => ({
    siteName: '归零杂记',
    apiHost: 'https://open.memos.dengchangdong.com',
    pageLimit: 10,
    navLinks: []
  }),
  
  actions: {
    initialize() {
      // 从全局变量中读取配置（这些变量将从服务端注入）
      if (window.__APP_CONFIG__) {
        this.siteName = window.__APP_CONFIG__.siteName || this.siteName;
        this.apiHost = window.__APP_CONFIG__.apiHost || this.apiHost;
        this.pageLimit = window.__APP_CONFIG__.pageLimit || this.pageLimit;
        
        if (window.__APP_CONFIG__.navLinks) {
          try {
            this.navLinks = JSON.parse(window.__APP_CONFIG__.navLinks.replace(/'/g, '"'));
          } catch (e) {
            console.error('解析导航链接失败:', e);
          }
        }
      }
    },
    
    // 解析导航链接
    parseNavLinks(linksStr) {
      if (!linksStr) return [];
      
      try {
        const jsonStr = linksStr.replace(/'/g, '"');
        const linksObj = JSON.parse(jsonStr);
        return Object.entries(linksObj).map(([text, url]) => ({ text, url }));
      } catch (error) {
        console.error('解析导航链接失败:', error);
        return [];
      }
    }
  }
}); 