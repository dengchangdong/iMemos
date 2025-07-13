<template>
  <figure class="mt-4">
    <div v-if="count === 1" class="w-full">
      <div class="image-container w-full aspect-video relative bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
        <img 
          :src="transformImageUrl(resources[0].externalLink)" 
          :alt="resources[0].filename || '图片'" 
          class="rounded-lg w-full h-full object-cover transition-all duration-300 absolute inset-0 z-10 hover:scale-105 opacity-0" 
          loading="lazy" 
          data-preview="true"
          @load="onImageLoad"
        />
        <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 image-placeholder">
          <i class="ri-image-line text-2xl animate-pulse">📷</i>
        </div>
      </div>
    </div>
    
    <div v-else-if="count === 2" class="flex flex-wrap gap-1">
      <div 
        v-for="resource in resources" 
        :key="resource.id"
        class="image-container w-[calc(50%-2px)] aspect-square relative bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md"
      >
        <img 
          :src="transformImageUrl(resource.externalLink)" 
          :alt="resource.filename || '图片'" 
          class="rounded-lg w-full h-full object-cover transition-all duration-300 absolute inset-0 z-10 hover:scale-105 opacity-0" 
          loading="lazy" 
          data-preview="true"
          @load="onImageLoad"
        />
        <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 image-placeholder">
          <i class="ri-image-line text-2xl animate-pulse">📷</i>
        </div>
      </div>
    </div>
    
    <div v-else class="grid grid-cols-3 gap-1">
      <div 
        v-for="resource in resources" 
        :key="resource.id"
        class="image-container aspect-square relative bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md"
      >
        <img 
          :src="transformImageUrl(resource.externalLink)" 
          :alt="resource.filename || '图片'" 
          class="rounded-lg w-full h-full object-cover transition-all duration-300 absolute inset-0 z-10 hover:scale-105 opacity-0" 
          loading="lazy" 
          data-preview="true"
          @load="onImageLoad"
        />
        <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 image-placeholder">
          <i class="ri-image-line text-2xl animate-pulse">📷</i>
        </div>
      </div>
    </div>
  </figure>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  resources: {
    type: Array,
    required: true
  }
});

const count = computed(() => props.resources.length);

// 转换图片 URL 以使用 Cloudflare 的图片优化
const transformImageUrl = (originalLink) => {
  if (!originalLink) return '';
  
  return originalLink.replace(
    'images-memos.dengchangdong.com',
    'images-memos.dengchangdong.com/cdn-cgi/image/h=800'
  );
};

// 图片加载完成后的处理
const onImageLoad = (event) => {
  event.target.classList.add('loaded');
};
</script> 