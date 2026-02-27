<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { apiPut } from '@/composables/useApi'

// ── i18n ──
type Locale = 'en' | 'zh'

const locale = ref<Locale>((localStorage.getItem('dashboard-locale') as Locale) || 'en')

function setLocale(l: Locale) {
  locale.value = l
  localStorage.setItem('dashboard-locale', l)
}

const messages: Record<Locale, Record<string, string>> = {
  en: {
    'title': 'Configuration',
    'refresh': 'Refresh',
    'refreshing': 'Refreshing...',
    'save': 'Save',
    'saving': 'Saving...',
    'saved': 'Saved',
    'loading': 'Loading...',

    'tab.general': 'General',
    'tab.env': 'Environment',
    'tab.permissions': 'Permissions',
    'tab.hooks': 'Hooks',
    'tab.raw': 'JSON',

    'model.title': 'Model',
    'model.desc': 'Select the Claude model to use',
    'model.opus': 'Most capable',
    'model.sonnet': 'Balanced',
    'model.haiku': 'Fast & light',

    'updates.title': 'Auto Updates',
    'updates.desc': 'Update channel',
    'updates.stable': 'Stable',
    'updates.preview': 'Preview',

    'dangerous.title': 'Skip Dangerous Mode Prompt',
    'dangerous.desc': 'Auto-accept without confirmation',
    'on': 'ON',
    'off': 'OFF',

    'env.subtitle': 'Environment variables for Claude Code',
    'env.show': 'Show',
    'env.hide': 'Hide',
    'env.add.title': 'Add Variable',
    'env.add.btn': 'Add',
    'env.desc.base_url': 'API Base URL',
    'env.desc.auth_token': 'API Auth Token',
    'env.desc.telemetry': 'Telemetry (1=on, 0=off)',
    'env.desc.http_proxy': 'HTTP Proxy',
    'env.desc.https_proxy': 'HTTPS Proxy',
    'env.desc.proxy_resolves': 'Proxy Resolves Hosts',
    'env.desc.disable_traffic': 'Disable Non-essential Traffic',

    'perm.mode.title': 'Default Mode',
    'perm.mode.desc': 'How Claude handles permissions',
    'perm.mode.accept': 'Accept Edits',
    'perm.mode.accept.desc': 'Auto-accept file edits',
    'perm.mode.plan': 'Plan',
    'perm.mode.plan.desc': 'Plan mode',
    'perm.mode.bypass': 'Bypass',
    'perm.mode.bypass.desc': 'Bypass all permissions (dangerous)',
    'perm.allow.title': 'Allow List',
    'perm.allow.desc': 'Auto-allowed tools and permissions',
    'perm.deny.title': 'Deny List',
    'perm.deny.desc': 'Always denied tools and permissions',
    'perm.empty': 'Empty',
    'perm.add': 'Add',

    'hooks.subtitle': 'Lifecycle hooks (read-only, edit in JSON tab)',
    'hooks.empty': 'No hooks configured',

    'raw.subtitle': 'Raw settings.json',
    'raw.invalid': 'Invalid JSON',
  },
  zh: {
    'title': '配置',
    'refresh': '刷新',
    'refreshing': '刷新中...',
    'save': '保存',
    'saving': '保存中...',
    'saved': '已保存',
    'loading': '加载中...',

    'tab.general': '常规',
    'tab.env': '环境变量',
    'tab.permissions': '权限',
    'tab.hooks': '钩子',
    'tab.raw': 'JSON',

    'model.title': '模型',
    'model.desc': '选择要使用的 Claude 模型',
    'model.opus': '最强模型',
    'model.sonnet': '均衡模型',
    'model.haiku': '快速轻量',

    'updates.title': '自动更新',
    'updates.desc': '更新通道',
    'updates.stable': '稳定版',
    'updates.preview': '预览版',

    'dangerous.title': '跳过危险模式提示',
    'dangerous.desc': '无需确认自动接受',
    'on': '开',
    'off': '关',

    'env.subtitle': 'Claude Code 环境变量',
    'env.show': '显示',
    'env.hide': '隐藏',
    'env.add.title': '添加变量',
    'env.add.btn': '添加',
    'env.desc.base_url': 'API 基础地址',
    'env.desc.auth_token': 'API 认证令牌',
    'env.desc.telemetry': '遥测 (1=开, 0=关)',
    'env.desc.http_proxy': 'HTTP 代理',
    'env.desc.https_proxy': 'HTTPS 代理',
    'env.desc.proxy_resolves': '代理解析主机',
    'env.desc.disable_traffic': '禁用非必要流量',

    'perm.mode.title': '默认模式',
    'perm.mode.desc': 'Claude 如何处理权限',
    'perm.mode.accept': '接受编辑',
    'perm.mode.accept.desc': '自动接受文件编辑',
    'perm.mode.plan': '计划',
    'perm.mode.plan.desc': '计划模式',
    'perm.mode.bypass': '绕过',
    'perm.mode.bypass.desc': '绕过所有权限（危险）',
    'perm.allow.title': '允许列表',
    'perm.allow.desc': '自动允许的工具和权限',
    'perm.deny.title': '拒绝列表',
    'perm.deny.desc': '始终拒绝的工具和权限',
    'perm.empty': '空',
    'perm.add': '添加',

    'hooks.subtitle': '生命周期钩子（只读，请在 JSON 标签页编辑）',
    'hooks.empty': '未配置钩子',

    'raw.subtitle': '原始配置文件',
    'raw.invalid': 'JSON 格式错误',
  },
}

function t(key: string): string {
  return messages[locale.value][key] || key
}

const envDescKeys: Record<string, string> = {
  ANTHROPIC_BASE_URL: 'env.desc.base_url',
  ANTHROPIC_AUTH_TOKEN: 'env.desc.auth_token',
  CLAUDE_CODE_ENABLE_TELEMETRY: 'env.desc.telemetry',
  HTTP_PROXY: 'env.desc.http_proxy',
  HTTPS_PROXY: 'env.desc.https_proxy',
  CLAUDE_CODE_PROXY_RESOLVES_HOSTS: 'env.desc.proxy_resolves',
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: 'env.desc.disable_traffic',
}

const tabKeys = ['general', 'env', 'permissions', 'hooks', 'raw']

const modelOptions = [
  { value: 'opus', label: 'Opus', descKey: 'model.opus' },
  { value: 'sonnet', label: 'Sonnet', descKey: 'model.sonnet' },
  { value: 'haiku', label: 'Haiku', descKey: 'model.haiku' },
]

const updateChannelOptions = [
  { value: 'stable', labelKey: 'updates.stable' },
  { value: 'preview', labelKey: 'updates.preview' },
]

const permissionModeOptions = [
  { value: 'acceptEdits', labelKey: 'perm.mode.accept', descKey: 'perm.mode.accept.desc' },
  { value: 'plan', labelKey: 'perm.mode.plan', descKey: 'perm.mode.plan.desc' },
  { value: 'bypassPermissions', labelKey: 'perm.mode.bypass', descKey: 'perm.mode.bypass.desc' },
]

// ── State ──
const config = ref<Record<string, any> | null>(null)
const loading = ref(true)
const saving = ref(false)
const saveMessage = ref('')
const activeTab = ref('general')
const refreshing = ref(false)

const newEnvKey = ref('')
const newEnvValue = ref('')
const newAllow = ref('')
const newDeny = ref('')

const rawJson = ref('')
const rawJsonValid = computed(() => {
  try { JSON.parse(rawJson.value); return true }
  catch { return false }
})

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

// ── Data ──
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
    saveMessage.value = t('saved')
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
    saveMessage.value = t('saved')
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
        <h2 class="text-xl font-bold text-accent">{{ t('title') }}</h2>
        <button
          class="px-2 py-1 text-xs bg-surface-light hover:bg-surface-lighter text-text-muted hover:text-text rounded border border-white/10 transition-colors disabled:opacity-40"
          :disabled="refreshing"
          @click="fetchConfig"
        >
          {{ refreshing ? t('refreshing') : t('refresh') }}
        </button>
      </div>
      <div class="flex items-center gap-3">
        <!-- Language toggle -->
        <div class="flex rounded border border-white/10 overflow-hidden text-xs">
          <button
            class="px-2 py-1 transition-colors"
            :class="locale === 'en' ? 'bg-accent text-surface' : 'text-text-muted hover:text-text'"
            @click="setLocale('en')"
          >
            EN
          </button>
          <button
            class="px-2 py-1 transition-colors border-l border-white/10"
            :class="locale === 'zh' ? 'bg-accent text-surface' : 'text-text-muted hover:text-text'"
            @click="setLocale('zh')"
          >
            中文
          </button>
        </div>
        <span v-if="saveMessage" class="text-sm text-green-400">{{ saveMessage }}</span>
        <button
          v-if="activeTab !== 'raw' && activeTab !== 'hooks'"
          class="px-4 py-2 bg-accent text-surface rounded text-sm font-medium disabled:opacity-40 hover:bg-accent-light transition-colors"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? t('saving') : t('save') }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-text-muted">{{ t('loading') }}</div>

    <div v-else-if="config">
      <!-- Tab bar -->
      <div class="flex gap-1 border-b border-white/10 mb-6">
        <button
          v-for="key in tabKeys"
          :key="key"
          class="px-4 py-2 text-sm transition-colors border-b-2 -mb-px"
          :class="activeTab === key
            ? 'border-accent text-accent'
            : 'border-transparent text-text-muted hover:text-text'"
          @click="selectTab(key)"
        >
          {{ t(`tab.${key}`) }}
        </button>
      </div>

      <!-- ==================== GENERAL ==================== -->
      <div v-if="activeTab === 'general'" class="space-y-8 max-w-2xl">
        <!-- Model -->
        <div>
          <h3 class="text-sm font-semibold text-text mb-1">{{ t('model.title') }}</h3>
          <p class="text-xs text-text-muted mb-3">{{ t('model.desc') }}</p>
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
              <p class="text-xs opacity-60 mt-0.5">{{ t(opt.descKey) }}</p>
            </button>
          </div>
        </div>

        <!-- Auto Updates -->
        <div>
          <h3 class="text-sm font-semibold text-text mb-1">{{ t('updates.title') }}</h3>
          <p class="text-xs text-text-muted mb-3">{{ t('updates.desc') }}</p>
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
              {{ t(opt.labelKey) }}
            </button>
          </div>
        </div>

        <!-- Skip Dangerous Mode -->
        <div class="flex items-center justify-between bg-surface-light rounded-lg border border-white/10 p-4">
          <div>
            <h3 class="text-sm font-semibold text-text">{{ t('dangerous.title') }}</h3>
            <p class="text-xs text-text-muted mt-0.5">{{ t('dangerous.desc') }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs" :class="config.skipDangerousModePermissionPrompt ? 'text-green-400' : 'text-text-muted'">
              {{ config.skipDangerousModePermissionPrompt ? t('on') : t('off') }}
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
        <p class="text-xs text-text-muted mb-4">{{ t('env.subtitle') }}</p>
        <div class="space-y-3">
          <div
            v-for="(_value, key) in config.env"
            :key="key"
            class="bg-surface-light rounded-lg border border-white/10 p-3"
          >
            <div class="flex items-center justify-between mb-1.5">
              <div>
                <p class="text-sm text-accent font-mono font-medium">{{ key }}</p>
                <p v-if="envDescKeys[String(key)]" class="text-xs text-text-muted">
                  {{ t(envDescKeys[String(key)]) }}
                </p>
              </div>
              <button
                class="text-text-muted hover:text-red-400 transition-colors text-sm px-2"
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
                {{ visibleSecrets[String(key)] ? t('env.hide') : t('env.show') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Add new env var -->
        <div class="border-t border-white/10 pt-4 mt-4">
          <p class="text-xs text-text-muted mb-2">{{ t('env.add.title') }}</p>
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
              {{ t('env.add.btn') }}
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== PERMISSIONS ==================== -->
      <div v-if="activeTab === 'permissions'" class="space-y-8 max-w-2xl">
        <!-- Default Mode -->
        <div>
          <h3 class="text-sm font-semibold text-text mb-1">{{ t('perm.mode.title') }}</h3>
          <p class="text-xs text-text-muted mb-3">{{ t('perm.mode.desc') }}</p>
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
                  {{ t(opt.labelKey) }}
                </p>
                <p class="text-xs opacity-60">{{ t(opt.descKey) }}</p>
              </div>
              <span v-if="config.permissions.defaultMode === opt.value" class="text-accent text-lg">&#10003;</span>
            </button>
          </div>
        </div>

        <!-- Allow list -->
        <div>
          <h3 class="text-sm font-semibold text-text mb-1">{{ t('perm.allow.title') }}</h3>
          <p class="text-xs text-text-muted mb-3">{{ t('perm.allow.desc') }}</p>
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
              {{ t('perm.empty') }}
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
              {{ t('perm.add') }}
            </button>
          </div>
        </div>

        <!-- Deny list -->
        <div>
          <h3 class="text-sm font-semibold text-text mb-1">{{ t('perm.deny.title') }}</h3>
          <p class="text-xs text-text-muted mb-3">{{ t('perm.deny.desc') }}</p>
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
              {{ t('perm.empty') }}
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
              {{ t('perm.add') }}
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== HOOKS ==================== -->
      <div v-if="activeTab === 'hooks'" class="max-w-2xl">
        <p class="text-xs text-text-muted mb-4">{{ t('hooks.subtitle') }}</p>
        <div v-if="hooksEntries.length === 0" class="text-text-muted text-sm py-4">
          {{ t('hooks.empty') }}
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
          <span class="text-xs text-text-muted">{{ t('raw.subtitle') }}</span>
          <span v-if="!rawJsonValid" class="text-xs text-red-400">{{ t('raw.invalid') }}</span>
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
            {{ saving ? t('saving') : t('save') }}
          </button>
          <span v-if="saveMessage && activeTab === 'raw'" class="text-sm text-green-400">
            {{ saveMessage }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
