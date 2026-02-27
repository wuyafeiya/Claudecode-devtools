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

interface SearchResult {
  ref: string
  name: string
  repo: string
  installs: string
  url: string
}

const skills = ref<Skill[]>([])
const plugins = ref<Plugin[]>([])
const loading = ref(true)
const refreshing = ref(false)

// Search state
const showSearch = ref(false)
const searchQuery = ref('')
const searchResults = ref<SearchResult[]>([])
const searching = ref(false)
const searchError = ref('')
const installingRef = ref<string | null>(null)
const installMessage = ref('')

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

async function searchSkills() {
  if (!searchQuery.value.trim()) return
  searching.value = true
  searchError.value = ''
  searchResults.value = []
  try {
    const res = await fetch(`/api/skills/search?q=${encodeURIComponent(searchQuery.value)}`)
    if (!res.ok) throw new Error('Search failed')
    searchResults.value = await res.json()
  }
  catch (err) {
    searchError.value = String(err)
  }
  finally {
    searching.value = false
  }
}

async function installSkill(result: SearchResult) {
  installingRef.value = result.ref
  installMessage.value = ''
  try {
    const res = await fetch('/api/skills/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: result.ref }),
    })
    const data = await res.json()
    if (res.ok) {
      installMessage.value = `Installed ${result.name}`
      await fetchSkillsAndPlugins()
      setTimeout(() => installMessage.value = '', 3000)
    }
    else {
      installMessage.value = `Failed: ${data.error}`
    }
  }
  catch (err) {
    installMessage.value = `Error: ${err}`
  }
  finally {
    installingRef.value = null
  }
}

function isInstalled(result: SearchResult): boolean {
  return skills.value.some(s => s.name === result.name)
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
      <button
        class="px-2 py-1 text-xs rounded border transition-colors"
        :class="showSearch
          ? 'bg-accent text-surface border-accent'
          : 'bg-surface-light hover:bg-surface-lighter text-text-muted hover:text-text border-white/10'"
        @click="showSearch = !showSearch"
      >
        {{ showSearch ? 'Close Search' : 'Search & Install' }}
      </button>
    </div>

    <!-- Search panel -->
    <div v-if="showSearch" class="mb-6 bg-surface-light rounded-lg border border-white/10 p-4">
      <div class="flex gap-2 mb-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search skills online (e.g. react, python, testing...)"
          class="flex-1 bg-surface text-text text-sm px-3 py-2 rounded border border-white/10 focus:outline-none focus:border-accent/50"
          @keydown.enter="searchSkills"
        />
        <button
          class="px-4 py-2 bg-accent text-surface rounded text-sm font-medium disabled:opacity-40 hover:bg-accent-light transition-colors"
          :disabled="searching || !searchQuery.trim()"
          @click="searchSkills"
        >
          {{ searching ? 'Searching...' : 'Search' }}
        </button>
      </div>

      <p v-if="installMessage" class="text-xs text-green-400 mb-2">{{ installMessage }}</p>
      <p v-if="searchError" class="text-xs text-red-400 mb-2">{{ searchError }}</p>

      <div v-if="searching" class="text-text-muted text-sm py-4 text-center">Searching...</div>

      <div v-else-if="searchResults.length > 0" class="space-y-2 max-h-80 overflow-auto">
        <div
          v-for="result in searchResults"
          :key="result.ref"
          class="flex items-center justify-between bg-surface rounded-lg border border-white/10 px-3 py-2"
        >
          <div class="min-w-0">
            <p class="text-sm text-text font-medium">{{ result.name }}</p>
            <p class="text-xs text-text-muted">
              {{ result.repo }} &middot; {{ result.installs }}
            </p>
          </div>
          <button
            v-if="isInstalled(result)"
            disabled
            class="shrink-0 px-3 py-1 text-xs rounded bg-white/10 text-text-muted"
          >
            Installed
          </button>
          <button
            v-else
            class="shrink-0 px-3 py-1 text-xs rounded bg-accent text-surface font-medium disabled:opacity-40 hover:bg-accent-light transition-colors"
            :disabled="installingRef === result.ref"
            @click="installSkill(result)"
          >
            {{ installingRef === result.ref ? 'Installing...' : 'Install' }}
          </button>
        </div>
      </div>

      <div v-else-if="searchQuery && !searching" class="text-text-muted text-sm py-4 text-center">
        No results. Try a different keyword.
      </div>
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
            @deleted="fetchSkillsAndPlugins"
          />
        </div>
      </section>
    </template>
  </div>
</template>
