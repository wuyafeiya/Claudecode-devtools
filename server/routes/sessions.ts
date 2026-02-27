import { Router } from 'express'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { paths } from '../utils/claude-paths.js'

const router = Router()

interface SessionSummary {
  id: string
  project: string
  startTime: string
  lastModified: string
  cwd: string
  version: string
  preview: string
}

interface ConversationMessage {
  role: string
  content: string
  timestamp: string
}

function extractTextContent(content: unknown): string {
  if (typeof content === 'string')
    return content
  if (Array.isArray(content)) {
    return content
      .filter((block: Record<string, unknown>) => block.type === 'text' && typeof block.text === 'string')
      .map((block: Record<string, unknown>) => block.text as string)
      .join('\n')
  }
  return ''
}

function isRealUserMessage(line: Record<string, unknown>): boolean {
  if (line.type !== 'user')
    return false
  if (line.isMeta === true)
    return false
  const content = extractTextContent((line.message as Record<string, unknown>)?.content)
  if (content.startsWith('<'))
    return false
  if (!content.trim())
    return false
  return true
}

function shouldIncludeMessage(line: Record<string, unknown>): boolean {
  if (line.isMeta === true)
    return false
  if (line.type === 'file-history-snapshot')
    return false
  if (line.type === 'system')
    return false
  if (line.type !== 'user' && line.type !== 'assistant')
    return false
  return true
}

router.get('/sessions', async (_req, res) => {
  try {
    const projectsDir = paths.projects
    let projectDirs: string[]
    try {
      projectDirs = await readdir(projectsDir)
    }
    catch {
      res.json([])
      return
    }

    const sessions: SessionSummary[] = []

    for (const project of projectDirs) {
      const projectPath = join(projectsDir, project)
      const projectStat = await stat(projectPath).catch(() => null)
      if (!projectStat?.isDirectory())
        continue

      let files: string[]
      try {
        files = (await readdir(projectPath)).filter(f => f.endsWith('.jsonl'))
      }
      catch {
        continue
      }

      for (const file of files) {
        const filePath = join(projectPath, file)
        const fileStat = await stat(filePath).catch(() => null)
        if (!fileStat)
          continue

        try {
          const rl = createInterface({
            input: createReadStream(filePath, { encoding: 'utf-8' }),
            crlfDelay: Infinity,
          })

          let sessionId = ''
          let startTime = ''
          let cwd = ''
          let version = ''
          let preview = ''
          let linesRead = 0

          for await (const rawLine of rl) {
            if (linesRead > 100)
              break
            linesRead++

            let line: Record<string, unknown>
            try {
              line = JSON.parse(rawLine)
            }
            catch {
              continue
            }

            // Extract session metadata from any user/assistant line
            if (!sessionId && line.sessionId)
              sessionId = line.sessionId as string
            if (!startTime && line.timestamp && (line.type === 'user' || line.type === 'assistant'))
              startTime = line.timestamp as string
            if (!cwd && line.cwd)
              cwd = line.cwd as string
            if (!version && line.version)
              version = line.version as string

            // Find first real user message for preview
            if (!preview && isRealUserMessage(line)) {
              const text = extractTextContent((line.message as Record<string, unknown>)?.content)
              preview = text.slice(0, 200)
            }

            // Stop early if we have everything
            if (sessionId && startTime && cwd && version && preview)
              break
          }

          rl.close()

          if (!sessionId)
            sessionId = file.replace('.jsonl', '')

          sessions.push({
            id: sessionId,
            project,
            startTime: startTime || fileStat.mtime.toISOString(),
            lastModified: fileStat.mtime.toISOString(),
            cwd: cwd || '',
            version: version || '',
            preview: preview || '(no preview)',
          })
        }
        catch {
          // Skip files that can't be parsed
        }
      }
    }

    // Sort by last modified, newest first
    sessions.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())

    res.json(sessions)
  }
  catch (err) {
    res.status(500).json({ error: 'Failed to list sessions', detail: String(err) })
  }
})

router.get('/sessions/:project/:id', async (req, res) => {
  try {
    const { project, id } = req.params
    const filePath = join(paths.projects, project, `${id}.jsonl`)

    // Verify file exists
    try {
      await stat(filePath)
    }
    catch {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const raw = await readFile(filePath, 'utf-8')
    const lines = raw.split('\n').filter(l => l.trim())

    const messages: ConversationMessage[] = []

    for (const rawLine of lines) {
      let line: Record<string, unknown>
      try {
        line = JSON.parse(rawLine)
      }
      catch {
        continue
      }

      if (!shouldIncludeMessage(line))
        continue

      const message = line.message as Record<string, unknown> | undefined
      if (!message)
        continue

      const role = message.role as string
      const content = extractTextContent(message.content)

      if (!content.trim())
        continue

      messages.push({
        role,
        content,
        timestamp: (line.timestamp as string) || '',
      })
    }

    res.json({
      id,
      messages,
    })
  }
  catch (err) {
    res.status(500).json({ error: 'Failed to read session', detail: String(err) })
  }
})

export default router
