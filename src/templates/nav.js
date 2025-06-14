/**
 * 解析导航链接
 * @param {string} linksStr - 导航链接JSON字符串
 * @returns {Array<{text: string, url: string}>} 解析后的导航链接数组
 */
export const parseNavLinks = (linksStr) => {
  if (!linksStr) return [];
  try {
    const jsonStr = linksStr.replace(/'/g, '"');
    const linksObj = JSON.parse(jsonStr);
    return Object.entries(linksObj).map(([text, url]) => ({ text, url }));
  } catch (error) {
    console.error('解析导航链接失败:', error);
    return [];
  }
}; 