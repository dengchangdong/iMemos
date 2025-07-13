import { createRouter, createWebHistory } from 'vue-router';

// 导入页面组件
const HomePage = () => import('./components/pages/Home.vue');
const MemoPage = () => import('./components/pages/Memo.vue');
const TagPage = () => import('./components/pages/Tag.vue');
const NotFoundPage = () => import('./components/pages/NotFound.vue');

// 创建路由配置
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    path: '/page/:page',
    name: 'page',
    component: HomePage,
    props: route => ({ page: parseInt(route.params.page) || 1 })
  },
  {
    path: '/post/:id',
    name: 'memo',
    component: MemoPage,
    props: true
  },
  {
    path: '/tag/:tag',
    name: 'tag',
    component: TagPage,
    props: true
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: NotFoundPage
  }
];

export default routes; 
