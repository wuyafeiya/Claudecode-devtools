<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  name: string
  description: string
}>()

const emit = defineEmits<{
  deleted: []
}>()

const expanded = ref(false)
const content = ref('')
const loading = ref(false)
const deleting = ref(false)
const confirmDelete = ref(false)

async function toggleExpand() {
  expanded.value = !expanded.value
  if (expanded.value && !content.value) {
    loading.value = true
    try {
      const res = await fetch(`/api/skills/${props.name}`)
      const data = await res.json()
      content.value = data.content
    }
    catch {
      content.value = 'Failed to load skill content'
    }
    finally {
      loading.value = false
    }
  }
}

async function handleDelete() {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    setTimeout(() => confirmDelete.value = false, 3000)
    return
  }
  deleting.value = true
  try {
    const res = await fetch(`/api/skills/${props.name}`, { method: 'DELETE' })
    if (res.ok)
      emit('deleted')
  }
  finally {
    deleting.value = false
    confirmDelete.value = false
  }
}
</script>

<template>
  <div
    class="bg-surface-light rounded-lg border border-white/10 overflow-hidden transition-colors hover:border-accent/30"
  >
    <div class="flex items-start">
      <button
        class="flex-1 text-left p-4 flex items-start justify-between gap-3"
        @click="toggleExpand"
      >
        <div class="min-w-0">
          <h3 class="text-accent font-medium text-sm">{{ name }}</h3>
          <p class="text-text-muted text-xs mt-1 line-clamp-2">{{ description || 'No description' }}</p>
        </div>
        <span
          class="shrink-0 text-text-muted transition-transform"
          :class="expanded ? 'rotate-90' : ''"
        >
          &#x25B6;
        </span>
      </button>
      <button
        class="shrink-0 px-3 py-4 text-text-muted hover:text-red-400 transition-colors"
        :class="confirmDelete ? 'text-red-400' : ''"
        :disabled="deleting"
        :title="confirmDelete ? 'Click again to confirm' : 'Delete skill'"
        @click.stop="handleDelete"
      >
        <span v-if="deleting">...</span>
        <span v-else-if="confirmDelete" class="text-xs font-medium">Confirm?</span>
        <span v-else>&#x2715;</span>
      </button>
    </div>
    <div v-if="expanded" class="border-t border-white/10 p-4">
      <p v-if="loading" class="text-text-muted text-xs">Loading...</p>
      <pre
        v-else
        class="text-xs text-text font-mono whitespace-pre-wrap max-h-80 overflow-auto"
      >{{ content }}</pre>
    </div>
  </div>
</template>
