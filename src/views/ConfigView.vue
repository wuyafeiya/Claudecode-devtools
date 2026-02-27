<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { apiPut } from '@/composables/useApi'

const config = ref<Record<string, any> | null>(null)
const loading = ref(true)
const saving = ref(false)
const saveMessage = ref('')
const activeTab = ref('general')
const refreshing = ref(false)

const tabs = [
  { key: 'general', zh: '常规', en: 'General' },
  { key: 'env', zh: '环境变量', en: 'Env' },
  { key: 'permissions', zh: '权限', en: 'Permissions' },
  { key: 'hooks', zh: '钩子', en: 'Hooks' },
  { key: 'raw', zh: '原始', en: 'JSON' },
]

const modelOptions = [
  { value: 'opus', label: 'Opus', desc: 'Most capable / 最强模型' },
  { value: 'sonnet', label: 'Sonnet', desc: 'Balanced / 均衡模型' },
  { value: 'haiku', label: 'Haiku', desc: 'Fast & light / 快速轻量' },
]

const updateChannelOptions = [
  { value: 'stable', label: 'Stable', desc: '稳定版' },
  { value: 'preview', label: 'Preview', desc: '预览版' },
]

const permissionModeOptions = [
  { value: 'acceptEdits', label: 'Accept Edits', desc: '自动接受编辑' },
  { value: 'plan', label: 'Plan', desc: '计划模式' },
  { value: 'bypassPermissions', label: 'Bypass', desc: '绕过权限 (危险)' },
]

const envDescriptions: Record<string, string> = {
  ANTHROPIC_BASE_URL: 'API Base URL / API 基础地址',
  ANTHROPIC_AUTH_TOKEN: 'API Auth Token / API 认证令牌',
  CLAUDE_CODE_ENABLE_TELEMETRY: 'Telemetry / 遥测 (1=on, 0=off)',
  HTTP_PROXY: 'HTTP Proxy / HTTP 代理',
  HTTPS_PROXY: 'HTTPS Proxy / HTTPS 代理',
  CLAUDE_CODE_PROXY_RESOLVES_HOSTS: 'Proxy Resolves Hosts / 代理解析主机',
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'Disable Non-essential Traffic / 禁用非必要流量',
}

// Env
const newEnvKey = ref('')
const newEnvValue = ref('')

// Permissions
const newAllow = ref('')
const newDeny = ref('')

// Raw JSON
const rawJson = ref('')
const rawJsonValid = computed(() => {
  try { JSON.parse(rawJson.value); return true }
  catch { return false }
})

// Secret visibility
const visibleSecrets = ref<Record<string, boolean>>({})

function isSensitive(key: string): boolean {
  const k = key.toUpperCase()
  return k.includes('TOKEN') || k.includes('KEY') || k.includes('SECRET') || k.includes('PASSWORD') || k.includes('AUTH')
}

function toggleSecret(key: string) {
  visibleSecrets.value = { ...visibleSecrets.value, [key]: !visibleSecrets.value[key] }
}

function selectTab(key: string) {
  activeTab.value = key
  if (key === 'raw' && config.value)
    rawJson.value = JSON.stringify(config.value, null, 2)
}

async function fetchConfig() {
  refreshing.value = true
  try {
    const res = await fetch('/api/config')
    config.value = await res.json()
    rawJson.value = JSON.stringify(config.value, null, 2)
    if (!config.value!.env) config.value!.env = {}
    if (!config.value!.permissions) config.value!.permissions = {}
    if (!config.value!.permissions.allow) config.value!.permissions.allow = []
    if (!config.value!.permissions.deny) config.value!.permissions.deny = []
  }
  finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(fetchConfig)

async function save() {
  if (!config.value) return
  saving.value = true
  saveMessage.value = ''
  try {
    await apiPut('/api/config', config.value)
    saveMessage.value = 'Saved / 已保存'
    rawJson.value = JSON.stringify(config.value, null, 2)
    setTimeout(() => saveMessage.value = '', 3000)
  }
  catch (err) {
    saveMessage.value = `Error: ${err}`
  }
  finally {
    saving.value = false
  }
}

async function saveFromRaw() {
  if (!rawJsonValid.value) return
  saving.value = true
  saveMessage.value = ''
  try {
    const parsed = JSON.parse(rawJson.value)
    await apiPut('/api/config', parsed)
    config.value = parsed
    if (!config.value!.env) config.value!.env = {}
    if (!config.value!.permissions) config.value!.permissions = {}
    if (!config.value!.permissions.allow) config.value!.permissions.allow = []
    if (!config.value!.permissions.deny) config.value!.permissions.deny = []
    saveMessage.value = 'Saved / 已保存'
    setTimeout(() => saveMessage.value = '', 3000)
  }
  catch (err) {
    saveMessage.value = `Error: ${err}`
  }
  finally {
    saving.value = false
  }
}

function addEnvVar() {
  if (!newEnvKey.value.trim() || !config.value) return
  config.value.env[newEnvKey.value.trim()] = newEnvValue.value
  config.value = { ...config.value }
  newEnvKey.value = ''
  newEnvValue.value = ''
}

function removeEnvVar(key: string) {
  if (!config.value) return
  delete config.value.env[key]
  config.value = { ...config.value, env: { ...config.value.env } }
}

function addAllow() {
  if (!newAllow.value.trim() || !config.value) return
  config.value.permissions.allow.push(newAllow.value.trim())
  newAllow.value = ''
}

function removeAllow(idx: number) {
  config.value?.permissions.allow.splice(idx, 1)
}

function addDeny() {
  if (!newDeny.value.trim() || !config.value) return
  config.value.permissions.deny.push(newDeny.value.trim())
  newDeny.value = ''
}

function removeDeny(idx: number) {
  config.value?.permissions.deny.splice(idx, 1)
}

const hooksEntries = computed(() => {
  if (!config.value?.hooks) return []
  return Object.entries(config.value.hooks).map(([event, groups]) => ({
    event,
    groups: groups as Array<{ hooks: Array<{ type: string; command: string; async?: boolean }> }>,
  }))
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <h2 class="text-xl font-bold text-accent">Configuration / 配置</h2>
        <button
          class="px-2 py-1 text-xs bg-surface-light hover:bg-surface-lighter text-text-muted hover:text-text rounded border border-white/10 transition-colors disabled:opacity-40"
          :disabled="refreshing"
          @click="fetchConfig"
        >
          {{ refreshing ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="saveMessage" class="text-sm text-green-400">{{ saveMessage }}</span>
        <button
          v-if="activeTab !== 'raw' && activeTab !== 'hooks'"
          class="px-4 py-2 bg-accent text-surface rounded text-sm font-medium disabled:opacity-40 hover:bg-accent-light transition-colors"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? 'Saving...' : 'Save / 保存' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-text-muted">Loading...</div>

    <div v-else-if="config">
      <!-- Tab bar -->
      <div class="flex gap-1 border-b border-white/10 mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="px-4 py-2 text-sm transition-colors border-b-2 -mb-px"
          :class="activeTab === tab.key
            ? 'border-accent text-accent'
            : 'border-transparent text-text-muted hover:text-text'"
          @click="selectTab(tab.key)"
        >
          {{ tab.zh }}
          <span class="opacity-50 ml-0.5">{{ tab.en }}</span>
        </button>
      </div>

      <!-- ==================== GENERAL ==================== -->
      <div v-if="activeTab === 'general'" class="space-y-8 max-w-2xl">
        <!-- Model -->
        <div>
          <h3 class="text-sm font-semibold text-text mb-1">Model / 模型</h3>
          <p class="text-xs text-text-muted mb-3">Select the Claude model / 选择 Claude 模型</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="opt in modelOptions"
              :key="opt.value"
              class="p-3 rounded-lg border text-left transition-all"
              :class="config.model === opt.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-white/10 hover:border-white/20 text-text'"
              @click="config.model = opt.value"
            >
              <p class="text-sm font-medium">{{ opt.label }}</p>
              <p class="text-xs opacity-60 mt-0.5">{{ opt.desc }}</p>
            </button>
          </div>
        </div>

        <!-- Auto Updates -->
        <div>
          <h3 class="text-sm font-semibold text-text mb-1">Auto Updates / 自动更新</h3>
          <p class="text-xs text-text-muted mb-3">Update channel / 更新通道</p>
          <div class="flex gap-2">
            <button
              v-for="opt in updateChannelOptions"
              :key="opt.value"
              class="px-4 py-2.5 rounded-lg border text-sm transition-all"
              :class="config.autoUpdatesChannel === opt.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-white/10 hover:border-white/20 text-text'"
              @click="config.autoUpdatesChannel = opt.value"
            >
              {{ opt.label }}
              <span class="opacity-60 ml-1">{{ opt.desc }}</span>
            </button>
          </div>
        </div>

        <!-- Skip Dangerous Mode -->
        <div class="flex items-center justify-between bg-surface-light rounded-lg border border-white/10 p-4">
          <div>
            <h3 class="text-sm font-semibold text-text">Skip Dangerous Mode Prompt / 跳过危险模式提示</h3>
            <p class="text-xs text-text-muted mt-0.5">Auto-accept without confirmation / 无需确认自动接受</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs" :class="config.skipDangerousModePermissionPrompt ? 'text-green-400' : 'text-text-muted'">
              {{ config.skipDangerousModePermissionPrompt ? 'ON' : 'OFF' }}
            </span>
            <button
              class="relative w-11 h-6 rounded-full transition-colors duration-200"
              :class="config.skipDangerousModePermissionPrompt ? 'bg-green-500' : 'bg-white/15'"
              @click="config.skipDangerousModePermissionPrompt = !config.skipDangerousModePermissionPrompt"
            >
              <span
                class="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow"
                :style="{ transform: config.skipDangerousModePermissionPrompt ? 'translateX(20px)' : 'translateX(0)' }"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== ENV ==================== -->
      <div v-if="activeTab === 'env'" class="max-w-3xl">
        <p class="text-xs text-text-muted mb-4">
          Environment variables for Claude Code / Claude Code 环境变量
        </p>
        <div class="space-y-3">
          <div
            v-for="(_value, key) in config.env"
            :key="key"
            class="bg-surface-light rounded-lg border border-white/10 p-3"
          >
            <div class="flex items-center justify-between mb-1.5">
              <div>
                <p class="text-sm text-accent font-mono font-medium">{{ key }}</p>
                <p v-if="envDescriptions[String(key)]" class="text-xs text-text-muted">
                  {{ envDescriptions[String(key)] }}
                </p>
              </div>
              <button
                class="text-text-muted hover:text-red-400 transition-colors text-sm px-2"
                title="Remove / 删除"
                @click="removeEnvVar(String(key))"
              >
                &#x2715;
              </button>
            </div>
            <div class="flex gap-2">
              <input
                :type="isSensitive(String(key)) && !visibleSecrets[String(key)] ? 'password' : 'text'"
                :value="config.env[key]"
                class="flex-1 bg-surface text-text text-sm px-3 py-1.5 rounded border border-white/10 focus:outline-none focus:border-accent/50 font-mono"
                @input="config.env[key] = ($event.target as HTMLInputElement).value"
              />
              <button
                v-if="isSensitive(String(key))"
                class="px-2.5 py-1 text-xs bg-surface hover:bg-surface-lighter text-text-muted hover:text-text rounded border border-white/10 transition-colors whitespace-nowrap"
                @click="toggleSecret(String(key))"
              >
                {{ visibleSecrets[String(key)] ? 'Hide / 隐藏' : 'Show / 显示' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Add new env var -->
        <div class="border-t border-white/10 pt-4 mt-4">
          <p class="text-xs text-text-muted mb-2">Add Variable / 添加变量</p>
          <div class="flex gap-2">
            <input
              v-model="newEnvKey"
              placeholder="KEY_NAME"
              class="w-52 bg-surface text-text text-sm px-3 py-1.5 rounded border border-white/10 focus:outline-none focus:border-accent/50 font-mono"
              @keydown.enter="addEnvVar"
            />
            <input
              v-model="newEnvValue"
              placeholder="value"
              class="flex-1 bg-surface text-text text-sm px-3 py-1.5 rounded border border-white/10 focus:outline-none focus:border-accent/50 font-mono"
              @keydown.enter="addEnvVar"
            />
            <button
              class="px-4 py-1.5 bg-accent text-surface rounded text-sm font-medium disabled:opacity-40 hover:bg-accent-light transition-colors"
              :disabled="!newEnvKey.trim()"
              @click="addEnvVar"
            >
              Add / 添加
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== PERMISSIONS ==================== -->
      <div v-if="activeTab === 'permissions'" class="space-y-8 max-w-2xl">
        <!-- Default Mode -->
        <div>
          <h3 class="text-sm font-semibold text-text mb-1">Default Mode / 默认模式</h3>
          <p class="text-xs text-text-muted mb-3">How Claude handles permissions / Claude 如何处理权限</p>
          <div class="space-y-2">
            <button
              v-for="opt in permissionModeOptions"
              :key="opt.value"
              class="w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between"
              :class="config.permissions.defaultMode === opt.value
                ? 'border-accent bg-accent/10'
                : 'border-white/10 hover:border-white/20'"
              @click="config.permissions.defaultMode = opt.value"
            >
              <div>
                <p
                  class="text-sm font-medium"
                  :class="config.permissions.defaultMode === opt.value ? 'text-accent' : 'text-text'"
                >
                  {{ opt.label }}
                </p>
                <p class="text-xs opacity-60">{{ opt.desc }}</p>
              </div>
              <span v-if="config.permissions.defaultMode === opt.value" class="text-accent text-lg">&#10003;</span>
            </button>
          </div>
        </div>

        <!-- Allow list -->
        <div>
          <h3 class="text-sm font-semibold text-text mb-1">Allow List / 允许列表</h3>
          <p class="text-xs text-text-muted mb-3">Auto-allowed tools / 自动允许的工具</p>
          <div class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="(item, idx) in config.permissions.allow"
              :key="idx"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/15 text-green-400 text-xs rounded-full border border-green-500/20"
            >
              {{ item }}
              <button
                class="hover:text-red-400 transition-colors"
                @click="removeAllow(idx)"
              >&#x2715;</button>
            </span>
            <span v-if="config.permissions.allow.length === 0" class="text-xs text-text-muted italic">
              Empty / 空
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newAllow"
              placeholder="e.g. mcp__playwright"
              class="flex-1 bg-surface text-text text-sm px-3 py-1.5 rounded border border-white/10 focus:outline-none focus:border-accent/50 font-mono"
              @keydown.enter="addAllow"
            />
            <button
              class="px-4 py-1.5 bg-accent text-surface rounded text-sm font-medium disabled:opacity-40 hover:bg-accent-light transition-colors"
              :disabled="!newAllow.trim()"
              @click="addAllow"
            >
              Add
            </button>
          </div>
        </div>

        <!-- Deny list -->
        <div>
          <h3 class="text-sm font-semibold text-text mb-1">Deny List / 拒绝列表</h3>
          <p class="text-xs text-text-muted mb-3">Always denied tools / 始终拒绝的工具</p>
          <div class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="(item, idx) in config.permissions.deny"
              :key="idx"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/15 text-red-400 text-xs rounded-full border border-red-500/20"
            >
              {{ item }}
              <button
                class="hover:text-white transition-colors"
                @click="removeDeny(idx)"
              >&#x2715;</button>
            </span>
            <span v-if="config.permissions.deny.length === 0" class="text-xs text-text-muted italic">
              Empty / 空
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="newDeny"
              placeholder="e.g. Bash(rm -rf)"
              class="flex-1 bg-surface text-text text-sm px-3 py-1.5 rounded border border-white/10 focus:outline-none focus:border-accent/50 font-mono"
              @keydown.enter="addDeny"
            />
            <button
              class="px-4 py-1.5 bg-accent text-surface rounded text-sm font-medium disabled:opacity-40 hover:bg-accent-light transition-colors"
              :disabled="!newDeny.trim()"
              @click="addDeny"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== HOOKS ==================== -->
      <div v-if="activeTab === 'hooks'" class="max-w-2xl">
        <p class="text-xs text-text-muted mb-4">
          Lifecycle hooks (read-only, edit in JSON tab) / 生命周期钩子（只读，请在 JSON 标签页编辑）
        </p>
        <div v-if="hooksEntries.length === 0" class="text-text-muted text-sm py-4">
          No hooks configured / 未配置钩子
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="entry in hooksEntries"
            :key="entry.event"
            class="bg-surface-light rounded-lg border border-white/10 overflow-hidden"
          >
            <div class="px-4 py-3 border-b border-white/5 bg-white/3">
              <h4 class="text-sm font-medium text-accent">{{ entry.event }}</h4>
            </div>
            <div class="p-4 space-y-3">
              <template v-for="(group, gi) in entry.groups" :key="gi">
                <div
                  v-for="(hook, hi) in group.hooks"
                  :key="hi"
                  class="flex items-start gap-3"
                >
                  <span class="shrink-0 px-1.5 py-0.5 bg-white/8 text-text-muted text-xs rounded font-mono">
                    {{ hook.type }}
                  </span>
                  <code class="text-xs text-text font-mono break-all leading-relaxed">{{ hook.command }}</code>
                  <span
                    v-if="hook.async"
                    class="shrink-0 px-1.5 py-0.5 bg-yellow-500/15 text-yellow-400 text-xs rounded"
                  >
                    async
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== RAW JSON ==================== -->
      <div v-if="activeTab === 'raw'" class="flex flex-col h-[calc(100vh-12rem)]">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-xs text-text-muted">
            Raw settings.json / 原始配置文件
          </span>
          <span v-if="!rawJsonValid" class="text-xs text-red-400">
            Invalid JSON / JSON 格式错误
          </span>
        </div>
        <textarea
          v-model="rawJson"
          class="flex-1 bg-surface-light text-text font-mono text-sm p-4 rounded border border-white/10 resize-none focus:outline-none focus:border-accent/50"
          spellcheck="false"
        />
        <div class="flex items-center gap-3 mt-3">
          <button
            :disabled="!rawJsonValid || saving"
            class="px-4 py-2 bg-accent text-surface rounded text-sm font-medium disabled:opacity-40 hover:bg-accent-light transition-colors"
            @click="saveFromRaw"
          >
            {{ saving ? 'Saving...' : 'Save / 保存' }}
          </button>
          <span v-if="saveMessage && activeTab === 'raw'" class="text-sm text-green-400">
            {{ saveMessage }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
