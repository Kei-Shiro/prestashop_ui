<template>
  <div class="admin-layout">
    <header>Admin Header</header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
}
</style>
