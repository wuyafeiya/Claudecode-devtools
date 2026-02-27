<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { apiPut } from '@/composables/useApi'

const config = ref<Record<string, unknown> | null>(null)
const editingJson = ref('')
const saving = ref(false)
const saveMessage = ref('')
const activeSection = ref<string | null>(null)
const refreshing = ref(false)

async function fetchConfig() {
  refreshing.value = true
  try {
    const res = await fetch('/api/config')
    config.value = await res.json()
    editingJson.value = JSON.stringify(
      activeSection.value ? config.value![activeSection.value] : config.value,
      null,
      2,
    )
  }
  finally {
    refreshing.value = false
  }
}

onMounted(fetchConfig)

const sections = computed(() => {
  if (!config.value) return []
  return Object.keys(config.value)
})

function selectSection(key: string) {
  if (!config.value) return
  activeSection.value = key
  editingJson.value = JSON.stringify(config.value[key], null, 2)
}

function showFullConfig() {
  activeSection.value = null
  editingJson.value = JSON.stringify(config.value, null, 2)
}

const jsonValid = computed(() => {
  try {
    JSON.parse(editingJson.value)
    return true
  }
  catch {
    return false
  }
})

async function save() {
  if (!jsonValid.value) return
  saving.value = true
  saveMessage.value = ''
  try {
    const parsed = JSON.parse(editingJson.value)
    if (activeSection.value) {
      config.value![activeSection.value] = parsed
      await apiPut('/api/config', config.value)
    }
    else {
      config.value = parsed
      await apiPut('/api/config', parsed)
    }
    saveMessage.value = 'Saved'
    setTimeout(() => saveMessage.value = '', 2000)
  }
  catch (err) {
    saveMessage.value = `Error: ${err}`
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-4">
      <h2 class="text-xl font-bold text-accent">Configuration</h2>
      <button
        class="px-2 py-1 text-xs bg-surface-light hover:bg-surface-lighter text-text-muted hover:text-text rounded border border-white/10 transition-colors disabled:opacity-40"
        :disabled="refreshing"
        @click="fetchConfig"
      >
        {{ refreshing ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="!config" class="text-text-muted">Loading...</div>

    <div v-else class="flex gap-4 h-[calc(100vh-8rem)]">
      <!-- Section tree -->
      <div class="w-48 shrink-0 space-y-1">
        <button
          class="w-full text-left px-3 py-2 rounded text-sm transition-colors"
          :class="activeSection === null ? 'bg-surface-lighter text-accent' : 'hover:bg-surface-light text-text'"
          @click="showFullConfig"
        >
          Full Config
        </button>
        <button
          v-for="key in sections"
          :key="key"
          class="w-full text-left px-3 py-2 rounded text-sm transition-colors"
          :class="activeSection === key ? 'bg-surface-lighter text-accent' : 'hover:bg-surface-light text-text'"
          @click="selectSection(key)"
        >
          {{ key }}
        </button>
      </div>

      <!-- Editor -->
      <div class="flex-1 flex flex-col">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-sm text-text-muted">
            {{ activeSection ? `Editing: ${activeSection}` : 'Editing: full config' }}
          </span>
          <span
            v-if="!jsonValid"
            class="text-xs text-red-400"
          >
            Invalid JSON
          </span>
        </div>
        <textarea
          v-model="editingJson"
          class="flex-1 bg-surface-light text-text font-mono text-sm p-4 rounded border border-white/10 resize-none focus:outline-none focus:border-accent/50"
          spellcheck="false"
        />
        <div class="flex items-center gap-3 mt-3">
          <button
            :disabled="!jsonValid || saving"
            class="px-4 py-2 bg-accent text-surface rounded text-sm font-medium disabled:opacity-40 hover:bg-accent-light transition-colors"
            @click="save"
          >
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <span v-if="saveMessage" class="text-sm text-green-400">{{ saveMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
