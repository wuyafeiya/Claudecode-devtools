import express from 'express'
import configRoutes from './routes/config.js'
import skillsRoutes from './routes/skills.js'
import pluginsRoutes from './routes/plugins.js'
import sessionsRoutes from './routes/sessions.js'

const app = express()
const port = Number(process.env.API_PORT) || 3456

app.use(express.json())
app.use('/api', configRoutes)
app.use('/api', skillsRoutes)
app.use('/api', pluginsRoutes)
app.use('/api', sessionsRoutes)

app.get('/api/session', (_req, res) => {
  res.json({
    startTime: new Date().toISOString(),
    workDir: process.cwd(),
    nodeVersion: process.version,
    pid: process.pid,
  })
})

app.listen(port, () => {
  console.log(`Claude Dashboard API server running on http://localhost:${port}`)
})
