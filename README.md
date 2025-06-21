# Memos Themes

一个基于 Cloudflare Workers 的 Memo 展示应用，提供美观的界面和响应式设计。

## 功能特点

- 响应式设计，支持移动端和桌面端
- 自动适应系统深色/浅色模式
- 优雅的图片展示
- 分页加载
- 基于 TailwindCSS 的现代化 UI

## 开发环境设置

1. 安装依赖：

```bash
npm install
```

2. 本地开发：

```bash
npm run dev
```

3. 部署到 Cloudflare Workers：

```bash
npm run deploy
```

## 环境变量

在部署之前，请确保设置以下环境变量：

- `API_BASE_URL`: Memo API 的基础 URL

## 技术栈

- Cloudflare Workers
- Hono
- TailwindCSS
- Tabler Icons

## 许可证

MIT 