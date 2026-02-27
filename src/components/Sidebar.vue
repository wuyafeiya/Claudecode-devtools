<script setup lang="ts">
import { ref, onMounted } from 'vue'

const sessionInfo = ref<{ startTime: string; workDir: string } | null>(null)

onMounted(async () => {
  try {
    const res = await fetch('/api/session')
    sessionInfo.value = await res.json()
  }
  catch {}
})

const navItems = [
  { path: '/config', label: 'Configuration', icon: 'i-carbon-settings' },
  { path: '/skills', label: 'Skills & Plugins', icon: 'i-carbon-plug' },
]
</script>

<template>
  <aside class="w-60 h-screen bg-surface flex flex-col border-r border-white/10">
    <div class="p-4 border-b border-white/10">
      <h1 class="text-accent font-bold text-lg">Claude Dashboard</h1>
      <p v-if="sessionInfo" class="text-text-muted text-xs mt-1 truncate">
        {{ sessionInfo.workDir }}
      </p>
    </div>
    <nav class="flex-1 py-2">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-4 py-2.5 text-text hover:bg-surface-light transition-colors"
        active-class="!bg-surface-lighter text-accent"
      >
        <span :class="item.icon" />
        <span class="text-sm">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>
