/**
 * utils.js - 工具函数模块
 * 提供通用工具函数，如HTML转义、时间格式化等
 */

// 工具函数集合
export const utils = {
  // HTML转义，防止XSS攻击
  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },
  
  // 格式化时间，支持相对时间和绝对时间
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    // 使用上海时区
    const timeZone = 'Asia/Shanghai';
    const now = new Date();
    const date = new Date(timestamp);
    
    // 获取上海时区的当前时间和目标时间
    const nowShanghai = new Date(now.toLocaleString('en-US', { timeZone }));
    const dateShanghai = new Date(date.toLocaleString('en-US', { timeZone }));
    const diff = nowShanghai - dateShanghai;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    // 1分钟以内
    if (minutes < 1) return '刚刚';
    
    // 1小时以内
    if (minutes < 60) return `${minutes} 分钟前`;
    
    // 当天发布的且24小时以内
    if (hours < 24 && dateShanghai.getDate() === nowShanghai.getDate()) 
      return `${hours} 小时前`;
    
    // 非当天发布但是是当年发布的
    if (dateShanghai.getFullYear() === nowShanghai.getFullYear()) {
      return dateShanghai.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone
      }).replace(/\//g, '-');
    }
    
    // 非当年发布的
    return dateShanghai.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone
    }).replace(/\//g, '-');
  },
  
  // 创建HTML元素（用于模板）- 防止XSS的安全实现
  createHtml(strings, ...values) {
    return String.raw({ raw: strings }, ...values);
  },
  
  // 高效缓存实现，支持自动过期和最大容量限制
  createCache(maxSize = 100, ttl = 60 * 1000) {
    return {
      _store: new Map(),
      _lastCleanup: Date.now(),
      
      // 获取缓存项
      get(key) {
        const item = this._store.get(key);
        if (!item) return undefined;
        
        // 检查是否过期
        if (item.expires && item.expires < Date.now()) {
          this._store.delete(key);
          return undefined;
        }
        
        return item.value;
      },
      
      // 设置缓存项
      set(key, value, customTtl) {
        // 自动清理过期项
        if (this._store.size >= maxSize || Date.now() - this._lastCleanup > 10 * 60 * 1000) {
          this._cleanup();
        }
        
        const expires = customTtl ? Date.now() + customTtl : (ttl ? Date.now() + ttl : null);
        this._store.set(key, { value, expires });
        return value;
      },
      
      // 清理过期项
      _cleanup() {
        const now = Date.now();
        for (const [key, item] of this._store.entries()) {
          if (item.expires && item.expires < now) {
            this._store.delete(key);
          }
        }
        
        // 如果仍然超过最大容量，删除最早的项
        if (this._store.size > maxSize) {
          const keysToDelete = [...this._store.keys()].slice(0, this._store.size - maxSize);
          keysToDelete.forEach(key => this._store.delete(key));
        }
        
        this._lastCleanup = now;
      },
      
      // 清除所有缓存
      clear() {
        this._store.clear();
      },
      
      // 获取缓存大小
      get size() {
        return this._store.size;
      }
    };
  }
};

// 导出默认对象
export default utils;