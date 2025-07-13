<template>
  <div class="not-found flex flex-col items-center justify-center py-16">
    <h1 class="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">404</h1>
    <p class="text-xl text-gray-700 dark:text-gray-300 mb-8">未找到内容</p>
    <p class="text-gray-600 dark:text-gray-400 mb-8">您访问的内容不存在或已被删除</p>
    <router-link to="/" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors duration-300">
      返回首页
    </router-link>
  </div>
</template>

<script setup>
// 不需要特殊逻辑
</script> 