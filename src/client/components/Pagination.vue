<template>
  <div class="pagination flex justify-center items-center mt-8">
    <!-- 首页的分页 -->
    <template v-if="isHomePage && currentPage === 1">
      <router-link 
        v-if="hasMore"
        to="/page/2" 
        class="pagination-button"
      >
        <span class="mr-2">⬇️</span> 查看更多内容
      </router-link>
    </template>
    
    <!-- 非首页的分页 -->
    <template v-else>
      <div class="flex space-x-4">
        <router-link 
          :to="currentPage > 2 ? `/page/${currentPage - 1}` : '/'" 
          class="pagination-button"
        >
          <span class="mr-2">⬅️</span> 上一页
        </router-link>
        
        <router-link 
          v-if="hasMore"
          :to="`/page/${currentPage + 1}`" 
          class="pagination-button"
        >
          下一页 <span class="ml-2">➡️</span>
        </router-link>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  hasMore: {
    type: Boolean,
    required: true
  }
});

const route = useRoute();
const isHomePage = computed(() => route.path === '/');
</script>

<style scoped>
.pagination-button {
  @apply inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-gradient-to-r from-blue-500 to-blue-600 text-white no-underline border-none cursor-pointer hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5 hover:shadow-lg shadow-md;
}
</style> 