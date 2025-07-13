<template>
  <div class="memo-page">
    <div v-if="loading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative my-4">
      <strong class="font-bold">错误!</strong>
      <span class="block sm:inline"> {{ error }}</span>
    </div>
    
    <div v-else-if="memo" class="memo-detail">
      <memo-item 
        :memo="memo" 
        :is-home-page="false"
      />
      
      <div class="mt-8">
        <router-link to="/" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
          ← 返回首页
        </router-link>
      </div>
    </div>
    
    <div v-else class="text-center py-10 text-gray-500 dark:text-gray-400">
      未找到记录
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useMemoStore } from '../../store/memo';
import MemoItem from '../MemoItem.vue';

const props = defineProps({
  id: {
    type: String,
    required: true
  }
});

const memoStore = useMemoStore();

const loading = computed(() => memoStore.loading);
const error = computed(() => memoStore.error);
const memo = computed(() => memoStore.memo);

onMounted(async () => {
  await memoStore.fetchMemo(props.id);
});
</script> 