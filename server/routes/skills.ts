import { Router } from 'express'
import { readdir, readFile, stat, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { paths } from '../utils/claude-paths.js'

const router = Router()

function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*m/g, '').replace(/[^\x20-\x7E\n]/g, '')
}

router.get('/skills', async (_req, res) => {
  try {
    const entries = await readdir(paths.skills)
    const skills = []
    for (const name of entries) {
      const skillDir = join(paths.skills, name)
      const s = await stat(skillDir)
      if (!s.isDirectory())
        continue
      const skillFile = join(skillDir, 'SKILL.md')
      try {
        const content = await readFile(skillFile, 'utf-8')
        // Parse frontmatter
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
        let description = ''
        if (fmMatch) {
          const descMatch = fmMatch[1].match(/description:\s*(.+)/)
          if (descMatch)
            description = descMatch[1].trim()
        }
        skills.push({ name, description, hasSkillFile: true })
      }
      catch {
        skills.push({ name, description: '', hasSkillFile: false })
      }
    }
    res.json(skills)
  }
  catch (err) {
    res.status(500).json({ error: 'Failed to list skills', detail: String(err) })
  }
})

router.get('/skills/search', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim()
    if (!query) {
      res.json([])
      return
    }
    const raw = execSync(`pnpx skills find ${JSON.stringify(query)} 2>&1`, {
      encoding: 'utf-8',
      timeout: 30000,
    })
    const clean = stripAnsi(raw)
    const results: Array<{ ref: string, name: string, repo: string, installs: string, url: string }> = []
    const lines = clean.split('\n')
    for (let i = 0; i < lines.length; i++) {
      // Match lines like: owner/repo@skill-name  123K installs
      const match = lines[i].match(/^([\w\-./]+@[\w\-.:]+)\s+([\d.]+K?\s*installs)/)
      if (match) {
        const ref = match[1]
        const installs = match[2].trim()
        const atIdx = ref.indexOf('@')
        const repo = ref.substring(0, atIdx)
        const name = ref.substring(atIdx + 1)
        // Next line has the URL
        let url = ''
        if (i + 1 < lines.length) {
          const urlMatch = lines[i + 1].match(/(https:\/\/skills\.sh\/\S+)/)
          if (urlMatch)
            url = urlMatch[1]
        }
        results.push({ ref, name, repo, installs, url })
      }
    }
    res.json(results)
  }
  catch (err) {
    res.status(500).json({ error: 'Search failed', detail: String(err) })
  }
})

router.get('/skills/:name', async (req, res) => {
  try {
    const skillFile = join(paths.skills, req.params.name, 'SKILL.md')
    const content = await readFile(skillFile, 'utf-8')
    res.json({ name: req.params.name, content })
  }
  catch (err) {
    res.status(404).json({ error: 'Skill not found', detail: String(err) })
  }
})

router.delete('/skills/:name', async (req, res) => {
  try {
    const skillDir = join(paths.skills, req.params.name)
    const s = await stat(skillDir)
    if (!s.isDirectory()) {
      res.status(404).json({ error: 'Skill not found' })
      return
    }
    await rm(skillDir, { recursive: true, force: true })
    res.json({ ok: true })
  }
  catch (err) {
    res.status(500).json({ error: 'Failed to delete skill', detail: String(err) })
  }
})

router.post('/skills/install', async (req, res) => {
  try {
    const { ref } = req.body
    if (!ref || typeof ref !== 'string') {
      res.status(400).json({ error: 'Missing ref field (e.g. "antfu/skills@vue")' })
      return
    }
    // Parse ref: "owner/repo@skill-name"
    const atIdx = ref.indexOf('@')
    if (atIdx === -1) {
      res.status(400).json({ error: 'Invalid ref format, expected owner/repo@skill-name' })
      return
    }
    const repo = ref.substring(0, atIdx)
    const skill = ref.substring(atIdx + 1)

    const output = execSync(
      `pnpx skills add ${JSON.stringify(repo)} -g -a claude-code --skill ${JSON.stringify(skill)} -y 2>&1`,
      { encoding: 'utf-8', timeout: 60000 },
    )
    res.json({ ok: true, output: stripAnsi(output) })
  }
  catch (err: any) {
    const output = err.stdout ? stripAnsi(String(err.stdout)) : ''
    res.status(500).json({ error: 'Install failed', detail: String(err.message), output })
  }
})

export default router
