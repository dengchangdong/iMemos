<template>
  <div class="memo-list space-y-6">
    <memo-item 
      v-for="memo in memos" 
      :key="memo.id"
      :memo="memo"
      :is-home-page="true"
    />
    
    <div v-if="memos.length === 0 && !loading" class="text-center py-10 text-gray-500 dark:text-gray-400">
      暂无内容
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import MemoItem from './MemoItem.vue';

defineProps({
  memos: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
  },
  hasMore: {
    type: Boolean,
    default: false
  }
});
</script> 