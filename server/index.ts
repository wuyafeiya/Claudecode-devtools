import express from 'express'
import configRoutes from './routes/config.js'

const app = express()
const port = Number(process.env.API_PORT) || 3456

app.use(express.json())
app.use('/api', configRoutes)

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
