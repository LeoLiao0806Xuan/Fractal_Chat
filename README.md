<div align="center">

# 🌿 Fractal Chat

**A recursive conversation tree for multi-model AI chat**

> Select any text → branch into a focused sub-dialogue → compare answers from GPT-4.1, Claude, DeepSeek, and more — side by side.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vitejs.dev/)

</div>

---

## ✨ Features

### 🧬 Recursive Sub-Dialogue Tree
Select any part of a response → right-click → create a focused sub-dialogue. Each sub-dialogue is a new branch where you can keep digging deeper, then merge insights back into the parent conversation.

<img src="public/assets/sub-dialogue-flow.svg" alt="Sub-dialogue flow" width="800">

### 🔄 Multi-Model Parallel Comparison
Send the same prompt to multiple LLMs at once and watch their responses stream in real-time, side by side. No more manual copy-paste between tabs.

<img src="public/assets/multi-model.svg" alt="Multi-model comparison" width="800">

### 🌲 Visual Conversation Tree
Navigate your entire conversation history as an interactive tree. Fold, expand, search, drag to reorder — your context never gets lost.

- **Full-text search** across all messages
- **Drag & drop** to reorder dialogues
- **Collapse/expand** for focus
- **Right-click context menu** for quick actions

<img src="public/assets/conversation-tree.svg" alt="Conversation tree" width="800">

### 🏷️ Organize & Export
- **Tags** and **archiving** for conversation management
- **Export** single dialogues or full trees as Markdown / JSON
- **Cross-dialogue @references** — link to any conversation

### ✏️ Edit & Version
- **Message editing** with version history
- **"Edited" timestamps** for transparency
- **Merge undo** — revert merged sub-dialogues with one click

---

## 🚀 Quick Start

```bash
git clone https://github.com/LeoLiao0806Xuan/Fractal_Chat.git
cd fractal-chat
npm install
npm run dev
```

Open `http://localhost:5173` — no backend, no database, no signup.

### Configure a model

1. Click ⚙️ in the input bar
2. Add your API endpoint (OpenAI / Anthropic / DeepSeek / any OpenAI-compatible)
3. Enter your API key (encrypted in-browser with AES-256-GCM)
4. Start chatting!

> **💡 Tip:** Add multiple models and toggle **⊕ Compare** mode — select which models to compare and send one prompt to all of them simultaneously.

---

## 🖼️ Screenshots

| Conversation Tree | Multi-Model Compare |
|---|---|
| <img src="public/assets/conversation-tree.svg" alt="Tree" width="300"> | <img src="public/assets/multi-model.svg" alt="Compare" width="300"> |

| Sub-Dialogue Flow | Architecture |
|---|---|
| <img src="public/assets/sub-dialogue-flow.svg" alt="Sub-dialogue" width="300"> | <img src="public/assets/hero.svg" alt="Architecture" width="300"> |

---

## 🏗️ Architecture

Fractal Chat is a **pure client-side** application. No backend, no user accounts, no data leaves your browser unless it's sent to the LLM APIs you configure.

```
┌──────────────────────────────────────┐
│          React 19 + TypeScript        │
│  ┌─────────┐  ┌───────────────────┐  │
│  │ Dialog  │  │  Chat Input       │  │
│  │ Tree    │  │  + ModelSelector  │  │
│  │ (recursive) │  (multi-model)     │  │
│  └────┬────┘  └────────┬──────────┘  │
│       │                │             │
│  ┌────▼────────────────▼──────────┐  │
│  │         Zustand Stores         │  │
│  │  dialogStore · modelStore      │  │
│  └────────────┬───────────────────┘  │
│       │                │             │
│  ┌────▼────┐   ┌──────▼────────┐   │
│  │IndexedDB│   │  API Layer    │   │
│  │ (idb)   │   │ callModel()   │   │
│  │persistence│  │ OAI/Anthropic │   │
│  └─────────┘   └──────┬────────┘   │
│                       │            │
│              ┌────────▼────────┐   │
│              │  LLM Providers  │   │
│              │  (your API key) │   │
│              └─────────────────┘   │
└──────────────────────────────────────┘
```

### Key decisions

| Choice | Why |
|--------|-----|
| **Pure client-side** | Zero ops, zero cost, complete privacy |
| **IndexedDB** via `idb` | Survives page refresh, no server needed |
| **Zustand** | Lightweight state — no boilerplate, no providers |
| **Tiptap** | Rich text rendering with Markdown support |
| **AES-256-GCM** | API keys encrypted before touching IndexedDB |

---

## 🧪 Testing

```bash
npm test        # Run tests (Vitest)
npm run build   # Type-check + production build
```

Current: **24 tests** across modelStore, dialogStore, and mergeUtils — all passing.

---

## 🗺️ Roadmap

- [x] Phase 0 — Prototype: API unification, persistence, error boundaries
- [x] Phase 1 — MVP: Sub-dialogues, tree navigation, search, export, tags
- [x] Multi-model parallel comparison
- [ ] Phase 2 — Core differentiation
  - [ ] Real-time collaboration (Yjs)
  - [ ] Mobile adaptation
  - [ ] Virtual scrolling for long conversations
  - [ ] Message-level auto-tagging
- [ ] Community
  - [ ] GitHub Discussions
  - [ ] i18n
  - [ ] Plugin system

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a PR.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

---

## 📄 License

[Apache 2.0](LICENSE) — Free for personal and commercial use.

---

<div align="center">

**Built with ❤️ for people who talk to AI a lot.**

</div>
