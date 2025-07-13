import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './styles/main.css';

// 导入路由配置
import routes from './router';

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 创建应用实例
const app = createApp(App);

// 启用 Pinia 状态管理
app.use(createPinia());

// 启用路由
app.use(router);

// 挂载应用
app.mount('#app'); 