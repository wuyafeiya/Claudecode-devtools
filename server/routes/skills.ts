import { Router } from 'express'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { paths } from '../utils/claude-paths.js'

const router = Router()

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

export default router
