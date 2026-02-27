import { Router } from 'express'
import { readFile, writeFile } from 'node:fs/promises'
import { paths } from '../utils/claude-paths.js'

const router = Router()

router.get('/config', async (_req, res) => {
  try {
    const raw = await readFile(paths.settings, 'utf-8')
    res.json(JSON.parse(raw))
  }
  catch (err) {
    res.status(500).json({ error: 'Failed to read settings', detail: String(err) })
  }
})

router.put('/config', async (req, res) => {
  try {
    const data = req.body
    if (!data || typeof data !== 'object') {
      res.status(400).json({ error: 'Invalid JSON body' })
      return
    }
    await writeFile(paths.settings, JSON.stringify(data, null, 2) + '\n', 'utf-8')
    res.json({ ok: true })
  }
  catch (err) {
    res.status(500).json({ error: 'Failed to write settings', detail: String(err) })
  }
})

router.patch('/config/:key', async (req, res) => {
  try {
    const raw = await readFile(paths.settings, 'utf-8')
    const config = JSON.parse(raw)
    const { key } = req.params
    config[key] = req.body
    await writeFile(paths.settings, JSON.stringify(config, null, 2) + '\n', 'utf-8')
    res.json({ ok: true })
  }
  catch (err) {
    res.status(500).json({ error: 'Failed to patch settings', detail: String(err) })
  }
})

export default router
