# PocketBase → AI to Production Pipeline

_Offline-first toolchain for turning AI-generated code into production-ready PocketBase applications._

---

## 🚀 Overview

The **PocketBase → AI to Production Pipeline** is a **100% offline**, **client-side web app** that helps developers:

1. Generate AI prompts for frontend screens
2. Merge AI-generated code (services, UI, hooks, scripts)
3. Discover business logic
4. Extract cron jobs
5. Migrate to `pb_hooks`
6. Harden code for enterprise use

All processing happens **in your browser** — no data leaves your device.

---

## 📦 Features

| Stage                          | Description                                                               |
| ------------------------------ | ------------------------------------------------------------------------- |
| **0. Prompt Generator**        | Create structured AI prompts for React + Tailwind screens                 |
| **1. Universal Merge Builder** | Merge AI-generated code: services, UI components, hooks, scripts, configs |
| **2. Discover Logic**          | Analyze merged code to extract business logic                             |
| **3. Extract Cron Jobs**       | Identify scheduled tasks and background jobs                              |
| **4. Migrate to pb_hooks**     | Convert logic to PocketBase server hooks (Go/Lua)                         |
| **5. Harden Code**             | Audit and secure code for production                                      |

### ✅ Key Benefits

- **100% Offline** — No internet required
- **Zero Data Leakage** — All processing in-browser
- **Universal Merge** — Works with services, UI, hooks, scripts, configs
- **localStorage Persistence** — Never lose your work
- **Dark Mode** — Easy on the eyes
- **Self-Contained** — Single HTML file + assets

---

## 🛠️ How to Use

### 1. Setup

1. Download or clone this project
2. Ensure you have:
   - `index.html`
   - `script.js`
   - `codemirror.js`, `codemirror.css`, `javascript.js`, `python.js`
3. Open `index.html` in any modern browser

> 🔐 No server needed — works from `file://`

### 2. Workflow

#### Stage 0: Generate AI Prompt

- Fill in screen details (name, components, collections)
- Click **"Generate Prompt"**
- Copy to send to your AI assistant (ChatGPT, Claude, etc.)

#### Stage 1: Merge AI Outputs

- Drag & drop AI-generated files (.js, .py, .go, .jsx, .vue, .sh, etc.)
- Edit, rename, or remove files
- Choose merge goal:
  - `UI Component` — Merge React/Vue components
  - `Client Hook` — Merge custom hooks or composables
  - `Script` — Merge automation scripts
  - `Config` — Merge config/rule files
  - `Service` — Merge backend services
- Click **"Generate Merge Prompt"** to create AI instruction

#### Stages 2–5: Production Pipeline

- Paste merged code into the **"Paste merged service code"** field
- Fill in project context (name, module, dependencies)
- Click **"Generate"** at each stage
- Copy output and implement in PocketBase

---

## 🧩 Technical Details

### File Structure

pocketbase-pipeline/
├── index.html # Main UI
├── script.js # Application logic
├── codemirror.js # Code editor core
├── codemirror.css # Editor styles
├── javascript.js # JS/JSX mode
├── python.js # Python mode
├── style.css # Custom styles (optional)
├── manifest.json # PWA support
├── sw.js # Service worker
└── favicon.png # App icon

### Tech Stack

- **Vanilla JavaScript** — No frameworks
- **CodeMirror 5** — In-browser code editing
- **localStorage** — Persistent data storage
- **Offline-First** — Works without internet
- **PWA Ready** — Can be installed as app

---

## 🔐 Security & Privacy

This tool is designed with **security first**:

- ✅ **No external API calls**
- ✅ **No analytics or tracking**
- ✅ **All data stored locally**
- ✅ **Works from `file://` URLs**
- ✅ **No code ever leaves your device**

Perfect for handling sensitive business logic and enterprise code.

---

## 💾 Persistence

All data is automatically saved to `localStorage`:

- ✅ Stage 0: Prompt inputs and output
- ✅ Stage 1: All merged files and settings
- ✅ Stages 2–5: All form fields and generated prompts
- ✅ Dark mode preference

Close and reopen — your work is preserved.

---

## 🧰 Development

### Adding New Features

1. Edit `script.js` for logic
2. Update `index.html` for UI
3. Test in browser
4. Ensure `localStorage` works across sessions

### Extending CodeMirror

To support more languages, add:

```html
<script src="mode/go/go.js"></script>
<script src="mode/lua/lua.js"></script>
<script src="mode/shell/shell.js"></script>

🙌 Acknowledgments PocketBase — The amazing Go-based backend CodeMirror —
In-browser code editing AI tools (ChatGPT, Claude, Qwen 3, DeepSeek R1) for code
generation 📬 Feedback & Contributions Found a bug? Want a new feature? Please
open an issue or PR. Maintainer: Jeremiah Tani Contact: jeremiahtani44@proton.me
```
