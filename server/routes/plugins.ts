import { Router } from 'express'
import { readFile, writeFile } from 'node:fs/promises'
import { paths } from '../utils/claude-paths.js'

const router = Router()

interface PluginInstall {
  scope: string
  projectPath?: string
  installPath: string
  version: string
  installedAt: string
  lastUpdated: string
  gitCommitSha?: string
}

interface PluginManifest {
  version: number
  plugins: Record<string, PluginInstall[]>
}

router.get('/plugins', async (_req, res) => {
  try {
    const raw = await readFile(paths.pluginManifest, 'utf-8')
    const manifest: PluginManifest = JSON.parse(raw)

    // Also read enabledPlugins from settings
    const settingsRaw = await readFile(paths.settings, 'utf-8')
    const settings = JSON.parse(settingsRaw)
    const enabled: Record<string, boolean> = settings.enabledPlugins || {}

    const plugins = Object.entries(manifest.plugins).map(([id, installs]) => ({
      id,
      enabled: enabled[id] ?? false,
      installs,
    }))

    res.json(plugins)
  }
  catch (err) {
    res.status(500).json({ error: 'Failed to list plugins', detail: String(err) })
  }
})

router.put('/plugins/:name/toggle', async (req, res) => {
  try {
    const pluginId = req.params.name
    const settingsRaw = await readFile(paths.settings, 'utf-8')
    const settings = JSON.parse(settingsRaw)
    if (!settings.enabledPlugins)
      settings.enabledPlugins = {}

    settings.enabledPlugins[pluginId] = !settings.enabledPlugins[pluginId]
    await writeFile(paths.settings, JSON.stringify(settings, null, 2) + '\n', 'utf-8')
    res.json({ ok: true, enabled: settings.enabledPlugins[pluginId] })
  }
  catch (err) {
    res.status(500).json({ error: 'Failed to toggle plugin', detail: String(err) })
  }
})

export default router
