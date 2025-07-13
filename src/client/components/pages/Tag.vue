<template>
  <div class="tag-page">
    <div class="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
      <h1 class="text-2xl font-bold text-blue-600 dark:text-blue-400">
        标签: {{ tag }}
      </h1>
    </div>
    
    <div v-if="loading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative my-4">
      <strong class="font-bold">错误!</strong>
      <span class="block sm:inline"> {{ error }}</span>
    </div>
    
    <div v-else>
      <memo-list 
        :memos="memos" 
        :loading="loading" 
        :current-page="currentPage"
        :has-more="hasMore"
      />
      
      <div v-if="memos.length === 0" class="text-center py-10 text-gray-500 dark:text-gray-400">
        此标签下暂无内容
      </div>
      
      <div class="mt-8">
        <router-link to="/" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
          ← 返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useMemoStore } from '../../store/memo';
import MemoList from '../MemoList.vue';

const props = defineProps({
  tag: {
    type: String,
    required: true
  }
});

const route = useRoute();
const memoStore = useMemoStore();

const loading = computed(() => memoStore.loading);
const error = computed(() => memoStore.error);
const memos = computed(() => memoStore.sortedMemos);
const currentPage = computed(() => memoStore.currentPage);
const hasMore = computed(() => memoStore.hasMore);

// 监听标签变化
watch(() => props.tag, (newTag) => {
  if (newTag) {
    loadMemos(newTag);
  }
}, { immediate: true });

// 加载数据
async function loadMemos(tag) {
  await memoStore.fetchMemos(1, tag);
}

onMounted(() => {
  loadMemos(props.tag);
});
</script> 