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

// Update state
interface UpdateInfo {
  name: string
  source: string
}
const updatesAvailable = ref<UpdateInfo[]>([])
const checkingUpdates = ref(false)
const updatingAll = ref(false)
const updateMessage = ref('')

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
    const idx = plugins.value.findIndex(p => p.id === plugin.id)
    if (idx !== -1)
      plugins.value[idx] = { ...plugin, enabled: res.enabled }
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

async function checkUpdates() {
  checkingUpdates.value = true
  updateMessage.value = ''
  try {
    const res = await fetch('/api/skills/check-updates')
    const data = await res.json()
    if (res.ok) {
      updatesAvailable.value = data.updates
      if (data.count === 0)
        updateMessage.value = 'All skills are up to date'
      else
        updateMessage.value = `${data.count} update(s) available`
      setTimeout(() => updateMessage.value = '', 5000)
    }
    else {
      updateMessage.value = `Check failed: ${data.error}`
    }
  }
  catch (err) {
    updateMessage.value = `Error: ${err}`
  }
  finally {
    checkingUpdates.value = false
  }
}

async function updateAll() {
  updatingAll.value = true
  updateMessage.value = 'Updating skills...'
  try {
    const res = await fetch('/api/skills/update-all', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      updateMessage.value = `Updated ${data.count} skill(s)`
      updatesAvailable.value = []
      await fetchSkillsAndPlugins()
      setTimeout(() => updateMessage.value = '', 5000)
    }
    else {
      updateMessage.value = `Update failed: ${data.error}`
    }
  }
  catch (err) {
    updateMessage.value = `Error: ${err}`
  }
  finally {
    updatingAll.value = false
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
      <button
        class="px-2 py-1 text-xs rounded border transition-colors"
        :class="showSearch
          ? 'bg-accent text-surface border-accent'
          : 'bg-surface-light hover:bg-surface-lighter text-text-muted hover:text-text border-white/10'"
        @click="showSearch = !showSearch"
      >
        {{ showSearch ? 'Close Search' : 'Search & Install' }}
      </button>
      <button
        class="px-2 py-1 text-xs bg-surface-light hover:bg-surface-lighter text-text-muted hover:text-text rounded border border-white/10 transition-colors disabled:opacity-40"
        :disabled="checkingUpdates || updatingAll"
        @click="checkUpdates"
      >
        {{ checkingUpdates ? 'Checking...' : 'Check Updates' }}
      </button>
    </div>

    <!-- Update banner -->
    <div v-if="updateMessage" class="mb-4 px-3 py-2 rounded-lg border text-xs"
      :class="updatesAvailable.length > 0
        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
        : 'bg-green-500/10 border-green-500/30 text-green-300'"
    >
      <div class="flex items-center justify-between">
        <span>{{ updateMessage }}</span>
        <button
          v-if="updatesAvailable.length > 0"
          class="px-3 py-1 bg-yellow-500 text-surface rounded text-xs font-medium disabled:opacity-40 hover:bg-yellow-400 transition-colors"
          :disabled="updatingAll"
          @click="updateAll"
        >
          {{ updatingAll ? 'Updating...' : 'Update All' }}
        </button>
      </div>
      <div v-if="updatesAvailable.length > 0" class="mt-2 space-y-1">
        <div v-for="u in updatesAvailable" :key="u.name" class="text-xs text-text-muted">
          &#x2191; {{ u.name }} <span v-if="u.source" class="opacity-60">from {{ u.source }}</span>
        </div>
      </div>
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
            <div class="flex items-center gap-2">
              <span class="text-xs" :class="plugin.enabled ? 'text-green-400' : 'text-text-muted'">
                {{ plugin.enabled ? 'ON' : 'OFF' }}
              </span>
              <button
                class="relative w-11 h-6 rounded-full transition-colors duration-200"
                :class="plugin.enabled ? 'bg-green-500' : 'bg-white/15'"
                @click="togglePlugin(plugin)"
              >
                <span
                  class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow"
                  :style="{ transform: plugin.enabled ? 'translateX(20px)' : 'translateX(0)' }"
                />
              </button>
            </div>
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
