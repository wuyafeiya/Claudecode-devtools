<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SkillCard from '@/components/SkillCard.vue'
import { apiPut } from '@/composables/useApi'

interface Skill {
  name: string
  description: string
  hasSkillFile: boolean
}

interface Plugin {
  id: string
  enabled: boolean
  installs: Array<{
    scope: string
    version: string
    installPath: string
  }>
}

const skills = ref<Skill[]>([])
const plugins = ref<Plugin[]>([])
const loading = ref(true)
const refreshing = ref(false)

async function fetchSkillsAndPlugins() {
  refreshing.value = true
  try {
    const [skillsRes, pluginsRes] = await Promise.all([
      fetch('/api/skills'),
      fetch('/api/plugins'),
    ])
    skills.value = await skillsRes.json()
    plugins.value = await pluginsRes.json()
  }
  finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(fetchSkillsAndPlugins)

async function togglePlugin(plugin: Plugin) {
  try {
    const res = await apiPut(`/api/plugins/${encodeURIComponent(plugin.id)}/toggle`, {})
    plugin.enabled = res.enabled
  }
  catch (err) {
    console.error('Failed to toggle plugin:', err)
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-4">
      <h2 class="text-xl font-bold text-accent">Skills & Plugins</h2>
      <button
        class="px-2 py-1 text-xs bg-surface-light hover:bg-surface-lighter text-text-muted hover:text-text rounded border border-white/10 transition-colors disabled:opacity-40"
        :disabled="refreshing"
        @click="fetchSkillsAndPlugins"
      >
        {{ refreshing ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="loading" class="text-text-muted">Loading...</div>

    <template v-else>
      <!-- Plugins section -->
      <section class="mb-8">
        <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          Plugins ({{ plugins.length }})
        </h3>
        <div class="space-y-2">
          <div
            v-for="plugin in plugins"
            :key="plugin.id"
            class="flex items-center justify-between bg-surface-light rounded-lg border border-white/10 p-4"
          >
            <div>
              <p class="text-sm text-text font-medium">{{ plugin.id }}</p>
              <p class="text-xs text-text-muted mt-0.5">
                v{{ plugin.installs[0]?.version }} &middot; {{ plugin.installs[0]?.scope }}
              </p>
            </div>
            <button
              class="relative w-10 h-5 rounded-full transition-colors"
              :class="plugin.enabled ? 'bg-accent' : 'bg-white/20'"
              @click="togglePlugin(plugin)"
            >
              <span
                class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                :class="plugin.enabled ? 'translate-x-5' : 'translate-x-0.5'"
              />
            </button>
          </div>
        </div>
      </section>

      <!-- Skills section -->
      <section>
        <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          Skills ({{ skills.length }})
        </h3>
        <div class="grid grid-cols-1 gap-2">
          <SkillCard
            v-for="skill in skills"
            :key="skill.name"
            :name="skill.name"
            :description="skill.description"
          />
        </div>
      </section>
    </template>
  </div>
</template>
