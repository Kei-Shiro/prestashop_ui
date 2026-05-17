<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
}

interface Emits {
  'update:currentPage': [page: number];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const totalPages = computed(() => Math.ceil(props.totalItems / props.itemsPerPage));

const pages = computed(() => {
  const range = [];
  const delta = 2;
  const left = props.currentPage - delta;
  const right = props.currentPage + delta + 1;
  
  for (let i = 1; i <= totalPages.value; i++) {
    if (i === 1 || i === totalPages.value || (i >= left && i < right)) {
      range.push(i);
    } else if (range[range.length - 1] !== '...') {
      range.push('...');
    }
  }
  return range;
});

const goToPage = (page: number | string) => {
  if (typeof page === 'number' && page !== props.currentPage) {
    emit('update:currentPage', page);
  }
};
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="Pagination">
    <button
      class="pagination__btn"
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1)"
    >
      &larr;
    </button>

    <div class="pagination__pages">
      <button
        v-for="page in pages"
        :key="page"
        class="pagination__page"
        :class="{ 'pagination__page--active': page === currentPage, 'pagination__page--dots': page === '...' }"
        :disabled="page === '...'"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>
    </div>

    <button
      class="pagination__btn"
      :disabled="currentPage === totalPages"
      @click="goToPage(currentPage + 1)"
    >
      &rarr;
    </button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 4rem;
}

.pagination__pages {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination__btn,
.pagination__page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: 0 0.5rem;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination__btn:hover:not(:disabled),
.pagination__page:hover:not(:disabled):not(.pagination__page--dots) {
  border-color: #1a1a2e;
  color: #1a1a2e;
  background-color: #f8fafc;
}

.pagination__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination__page--active {
  background-color: #1a1a2e;
  border-color: #1a1a2e;
  color: #ffffff !important;
}

.pagination__page--dots {
  border: none;
  cursor: default;
}
</style>
