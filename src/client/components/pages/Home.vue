<template>
  <div class="home-page">
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
      
      <pagination 
        v-if="memos.length > 0"
        :current-page="currentPage" 
        :has-more="hasMore"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useMemoStore } from '../../store/memo';

import MemoList from '../MemoList.vue';
import Pagination from '../Pagination.vue';

const props = defineProps({
  page: {
    type: Number,
    default: 1
  }
});

const route = useRoute();
const memoStore = useMemoStore();

const loading = computed(() => memoStore.loading);
const error = computed(() => memoStore.error);
const memos = computed(() => memoStore.sortedMemos);
const currentPage = computed(() => memoStore.currentPage);
const hasMore = computed(() => memoStore.hasMore);

// 监听页码变化
watch(() => props.page, (newPage) => {
  if (newPage !== currentPage.value) {
    loadMemos(newPage);
  }
}, { immediate: true });

// 加载数据
async function loadMemos(page = 1) {
  await memoStore.fetchMemos(page);
}

onMounted(() => {
  loadMemos(props.page);
});
</script> 