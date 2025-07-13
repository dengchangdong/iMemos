<template>
  <article 
    :class="[
      isHomePage 
        ? 'pb-8 border-l border-indigo-300 relative pl-5 ml-3 last:border-transparent last:pb-0 animate-fade-in' 
        : 'pb-8 last:pb-0 single-article animate-fade-in'
    ]"
  >
    <!-- 文章头部 -->
    <header>
      <div class="flex">
        <router-link v-if="isHomePage" :to="`/post/${memo.name}`" class="block">
          <time 
            :datetime="formatISOTime(timestamp)" 
            class="text-blue-600 dark:text-blue-400 font-poppins font-semibold block md:text-sm text-xs hover:text-blue-800 dark:hover:text-blue-300 transition-all"
          >
            {{ formatTime(timestamp) }}
          </time>
        </router-link>
        <time 
          v-else
          :datetime="formatISOTime(timestamp)" 
          class="text-blue-600 dark:text-blue-400 font-poppins font-semibold block md:text-sm text-xs"
        >
          {{ formatTime(timestamp) }}
        </time>
      </div>
    </header>
    
    <!-- 文章内容 -->
    <section class="text-gray-700 dark:text-gray-300 leading-relaxed mt-4 md:text-base text-sm article-content">
      <div v-html="parsedContent"></div>
      <resources-gallery v-if="resources.length > 0" :resources="resources" />
    </section>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import ResourcesGallery from './Gallery.vue';
import { marked } from 'marked';

const props = defineProps({
  memo: {
    type: Object,
    required: true
  },
  isHomePage: {
    type: Boolean,
    default: false
  }
});

// 时间戳处理
const timestamp = computed(() => {
  return props.memo.createTime 
    ? new Date(props.memo.createTime).getTime()
    : props.memo.createdTs * 1000;
});

// 格式化时间为 ISO 字符串
const formatISOTime = (timestamp) => {
  return new Date(timestamp).toISOString();
};

// 格式化时间为可读字符串
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

// 解析 Markdown 内容
const parsedContent = computed(() => {
  const content = props.memo.content || '';
  return marked(content);
});

// 资源列表
const resources = computed(() => {
  return props.memo.resources || props.memo.resourceList || [];
});
</script> 
