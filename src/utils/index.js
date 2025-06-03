// 通用工具函数

// HTML转义，防止XSS攻击
export function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 格式化时间（上海时区）
export function formatTime(timestamp) {
  const timeZone = 'Asia/Shanghai';
  const now = new Date();
  const date = new Date(timestamp);
  const nowShanghai = new Date(now.toLocaleString('en-US', { timeZone }));
  const dateShanghai = new Date(date.toLocaleString('en-US', { timeZone }));
  const diff = nowShanghai - dateShanghai;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24 && dateShanghai.getDate() === nowShanghai.getDate()) return `${hours} 小时前`;
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
  return dateShanghai.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone
  }).replace(/\//g, '-');
}

// 模板字符串辅助
export function createHtml(strings, ...values) {
  return String.raw({ raw: strings }, ...values);
} 