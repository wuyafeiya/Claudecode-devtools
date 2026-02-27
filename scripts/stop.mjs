import { readFileSync, unlinkSync } from 'node:fs'
import { readdirSync } from 'node:fs'

const tmpFiles = readdirSync('/tmp').filter(f => f.startsWith('claude-dashboard-'))

for (const file of tmpFiles) {
  const pidFile = `/tmp/${file}`
  try {
    const data = JSON.parse(readFileSync(pidFile, 'utf-8'))
    try { process.kill(data.apiPid) } catch {}
    try { process.kill(data.vitePid) } catch {}
    unlinkSync(pidFile)
    console.log(`Stopped dashboard (PID file: ${file})`)
  }
  catch {}
}

if (tmpFiles.length === 0) {
  console.log('No running dashboard found')
}
