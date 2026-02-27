# Claude Code DevTools

A local web dashboard that launches automatically with Claude Code CLI sessions, providing a browser-based interface to manage your Claude Code configuration and skills/plugins.

## Features

### Configuration Management
- Browse `settings.json` by section (env, permissions, model, etc.)
- Edit configuration with a JSON editor and syntax validation
- Save changes directly back to `~/.claude/settings.json`

### Skills & Plugins Management
- View all installed skills with descriptions
- Expand skills to read full SKILL.md content
- Delete skills with confirmation
- **Search & Install** — search the online skills registry and install with one click (powered by [skills-cli](https://github.com/antfu/skills-cli))
- Toggle plugins on/off with visual switch

## How It Works

The dashboard binds to your Claude Code session via **hooks**:

- **SessionStart** hook launches two background processes (API server + Vite dev server) and opens the browser
- **SessionEnd** hook kills both processes when you close Claude Code

```
Claude Code CLI
  └─ SessionStart Hook → start.mjs
       ├─ Node API Server (Express, random port) ← reads/writes ~/.claude/
       └─ Vite Dev Server (random port, proxies /api)
            └─ opens browser automatically
  └─ SessionEnd Hook → stop.mjs
       └─ kills both processes
```

## Installation

### Prerequisites

- Node.js >= 18
- pnpm

### Setup

```bash
# Clone into ~/.claude/dashboard/
git clone git@github.com:wuyafeiya/Claudecode-devtools.git ~/.claude/dashboard

# Install dependencies
cd ~/.claude/dashboard && pnpm install
```

### Configure Hooks

Add the following to your `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/dashboard/scripts/start.mjs &",
            "async": true
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/dashboard/scripts/stop.mjs"
          }
        ]
      }
    ]
  }
}
```

### Manual Usage

```bash
# Start
node ~/.claude/dashboard/scripts/start.mjs

# Stop
node ~/.claude/dashboard/scripts/stop.mjs

# Development mode (with HMR)
cd ~/.claude/dashboard && pnpm dev:all
```

## Tech Stack

- **Frontend:** Vue 3 + Vite + UnoCSS + vue-router
- **Backend:** Express (Node.js)
- **Language:** TypeScript

## Project Structure

```
~/.claude/dashboard/
├── server/
│   ├── index.ts              # API server entry
│   ├── routes/
│   │   ├── config.ts         # GET/PUT/PATCH /api/config
│   │   ├── skills.ts         # CRUD /api/skills + search + install
│   │   └── plugins.ts        # GET/PUT /api/plugins
│   └── utils/
│       └── claude-paths.ts   # ~/.claude/ path resolution
├── src/
│   ├── App.vue
│   ├── main.ts
│   ├── router/
│   ├── views/
│   │   ├── ConfigView.vue    # Configuration editor
│   │   └── SkillsView.vue    # Skills & plugins manager
│   ├── components/
│   │   ├── Sidebar.vue
│   │   └── SkillCard.vue
│   └── composables/
│       └── useApi.ts
├── scripts/
│   ├── start.mjs             # Launch dashboard
│   └── stop.mjs              # Kill dashboard
├── vite.config.ts
└── uno.config.ts
```

## License

MIT
