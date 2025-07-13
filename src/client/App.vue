<template>
  <div class="app-container bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen transition-colors duration-300">
    <header class="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 class="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{{ siteName }}</h1>
        
        <nav class="flex items-center space-x-4">
          <a 
            v-for="link in navLinks" 
            :key="link.url" 
            :href="link.url"
            class="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm md:text-base"
          >
            {{ link.text }}
          </a>
          <button 
            @click="toggleDarkMode"
            class="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
          >
            <span v-if="isDarkMode" class="block w-5 h-5">🌞</span>
            <span v-else class="block w-5 h-5">🌙</span>
          </button>
        </nav>
      </div>
    </header>

    <main class="container mx-auto p-4 md:p-6 lg:p-8">
      <router-view />
    </main>

    <footer class="container mx-auto px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
      <p>基于 Vue 3 + Cloudflare Workers 构建</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useConfigStore } from './store/config';

const configStore = useConfigStore();

// 网站名称和导航链接
const siteName = computed(() => configStore.siteName);
const navLinks = computed(() => configStore.navLinks);

// 深色模式设置
const isDarkMode = ref(false);

// 切换深色模式
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

// 初始化主题
onMounted(() => {
  // 检查用户偏好或系统设置
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    isDarkMode.value = true;
    document.documentElement.classList.add('dark');
  } else {
    isDarkMode.value = false;
    document.documentElement.classList.remove('dark');
  }
  
  // 初始化配置
  configStore.initialize();
});
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
}
</style> 