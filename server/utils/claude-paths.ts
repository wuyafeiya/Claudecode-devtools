import { homedir } from 'node:os'
import { join } from 'node:path'

export const CLAUDE_DIR = join(homedir(), '.claude')

export const paths = {
  settings: join(CLAUDE_DIR, 'settings.json'),
  settingsLocal: join(CLAUDE_DIR, 'settings.local.json'),
  skills: join(CLAUDE_DIR, 'skills'),
  plugins: join(CLAUDE_DIR, 'plugins'),
  pluginManifest: join(CLAUDE_DIR, 'plugins', 'installed_plugins.json'),
  history: join(CLAUDE_DIR, 'history.jsonl'),
}
