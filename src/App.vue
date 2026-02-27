<script setup lang="ts">
import Sidebar from '@/components/Sidebar.vue'
</script>

<template>
  <div class="flex h-screen bg-surface text-text">
    <Sidebar />
    <main class="flex-1 overflow-auto p-6">
      <RouterView />
    </main>
  </div>
</template>
