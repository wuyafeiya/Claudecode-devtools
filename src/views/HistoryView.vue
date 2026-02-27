<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Session {
  id: string
  project: string
  startTime: string
  lastModified: string
  cwd: string
  version: string
  preview: string
}

interface Message {
  role: string
  content: string
  timestamp: string
}

interface SessionDetail {
  id: string
  messages: Message[]
}

const sessions = ref<Session[]>([])
const selectedSession = ref<Session | null>(null)
const sessionDetail = ref<SessionDetail | null>(null)
const loadingSessions = ref(true)
const loadingDetail = ref(false)
const refreshing = ref(false)

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ', '
    + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

function shortDir(cwd: string): string {
  if (!cwd) return ''
  const segments = cwd.replace(/\/+$/, '').split('/')
  return segments[segments.length - 1] || cwd
}

async function fetchSessions() {
  refreshing.value = true
  try {
    const res = await fetch('/api/sessions')
    const data: Session[] = await res.json()
    sessions.value = data.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    )
  }
  finally {
    loadingSessions.value = false
    refreshing.value = false
  }
}

async function selectSession(session: Session) {
  selectedSession.value = session
  loadingDetail.value = true
  sessionDetail.value = null
  try {
    const res = await fetch(`/api/sessions/${encodeURIComponent(session.project)}/${encodeURIComponent(session.id)}`)
    sessionDetail.value = await res.json()
  }
  finally {
    loadingDetail.value = false
  }
}

onMounted(fetchSessions)
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-4">
      <h2 class="text-xl font-bold text-accent">Conversation History</h2>
      <button
        class="px-2 py-1 text-xs bg-surface-light hover:bg-surface-lighter text-text-muted hover:text-text rounded border border-white/10 transition-colors disabled:opacity-40"
        :disabled="refreshing"
        @click="fetchSessions"
      >
        {{ refreshing ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="loadingSessions" class="text-text-muted">Loading sessions...</div>

    <div v-else class="flex gap-4 h-[calc(100vh-8rem)]">
      <!-- Left panel: session list -->
      <div class="w-80 shrink-0 overflow-y-auto border-r border-white/10 pr-2 space-y-1">
        <button
          v-for="session in sessions"
          :key="session.id"
          class="w-full text-left px-3 py-3 rounded transition-colors"
          :class="selectedSession?.id === session.id ? 'bg-surface-lighter text-accent' : 'hover:bg-surface-light text-text'"
          @click="selectSession(session)"
        >
          <p class="text-sm truncate">{{ session.preview || '(no preview)' }}</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-text-muted">{{ formatDate(session.startTime) }}</span>
            <span class="text-xs text-text-muted">&middot;</span>
            <span class="text-xs text-text-muted truncate">{{ shortDir(session.cwd) }}</span>
          </div>
          <span
            v-if="session.version"
            class="inline-block mt-1 px-1.5 py-0.5 text-xs rounded bg-surface-light text-text-muted border border-white/10"
          >
            v{{ session.version }}
          </span>
        </button>
      </div>

      <!-- Right panel: conversation detail -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loadingDetail" class="text-text-muted">Loading conversation...</div>

        <div v-else-if="!selectedSession" class="flex items-center justify-center h-full">
          <p class="text-text-muted text-sm">Select a session to view</p>
        </div>

        <div v-else-if="sessionDetail" class="space-y-3">
          <div
            v-for="(msg, idx) in sessionDetail.messages"
            :key="idx"
            class="rounded-lg border border-white/10 p-4"
            :class="msg.role === 'user' ? 'bg-surface-lighter' : 'bg-surface'"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-semibold" :class="msg.role === 'user' ? 'text-accent' : 'text-text'">
                {{ msg.role === 'user' ? 'You' : 'Claude' }}
              </span>
              <span v-if="msg.timestamp" class="text-xs text-text-muted">
                {{ formatTimestamp(msg.timestamp) }}
              </span>
            </div>
            <pre class="whitespace-pre-wrap font-mono text-sm text-text">{{ msg.content }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
