import { execSync, spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { platform } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectDir = resolve(__dirname, '..')
const pidFile = `/tmp/claude-dashboard-${process.ppid}.pid`

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, () => {
      const port = server.address().port
      server.close(() => resolve(port))
    })
    server.on('error', reject)
  })
}

async function main() {
  // Check if deps installed
  if (!existsSync(resolve(projectDir, 'node_modules'))) {
    console.log('Installing dependencies...')
    execSync('pnpm install', { cwd: projectDir, stdio: 'inherit' })
  }

  const apiPort = await findFreePort()
  const vitePort = await findFreePort()

  // Start API server
  const apiProc = spawn('node_modules/.bin/tsx', ['server/index.ts'], {
    cwd: projectDir,
    env: { ...process.env, API_PORT: String(apiPort) },
    detached: true,
    stdio: 'ignore',
  })
  apiProc.unref()

  // Start Vite dev server
  const viteProc = spawn('node_modules/.bin/vite', ['--port', String(vitePort)], {
    cwd: projectDir,
    env: { ...process.env, API_PORT: String(apiPort) },
    detached: true,
    stdio: 'ignore',
  })
  viteProc.unref()

  // Save PIDs
  writeFileSync(pidFile, JSON.stringify({
    apiPid: apiProc.pid,
    vitePid: viteProc.pid,
    apiPort,
    vitePort,
  }))

  // Wait a moment for servers to start, then open browser
  await new Promise(r => setTimeout(r, 2000))

  const url = `http://localhost:${vitePort}`
  const cmd = platform() === 'darwin' ? 'open' : 'xdg-open'
  execSync(`${cmd} "${url}"`)

  console.log(`Dashboard: ${url} (API: ${apiPort})`)
}

main().catch(console.error)
