# Contributing to Fractal Chat

First off, thanks for taking the time to contribute! 🎉

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to make something great.

## How to Contribute

### 🐛 Report Bugs

1. Check existing issues to avoid duplicates
2. Use the bug report template when available
3. Include: steps to reproduce, expected vs actual behavior, browser/OS info
4. Screenshots or GIFs are extremely helpful

### 💡 Suggest Features

1. Open a feature request issue
2. Describe the problem you're solving, not just the feature
3. Explain how it fits Fractal Chat's vision (recursive conversation + multi-model)

### 🔧 Submit Pull Requests

1. **Fork** the repo
2. Create a branch: `git checkout -b feature/my-idea`
3. **Write tests** for your changes
4. Make sure `npm test` passes
5. Make sure `npm run build` passes (zero errors, zero warnings)
6. Push and open a PR

### PR Guidelines

| Do | Don't |
|----|-------|
| ✅ Keep PRs focused (one feature/fix per PR) | ❌ Mix unrelated changes |
| ✅ Write descriptive commit messages | ❌ Use vague messages like "fix stuff" |
| ✅ Add/update tests | ❌ Submit untested code |
| ✅ Match existing code style | ❌ Introduce new linting patterns unilaterally |
| ✅ Update docs if needed | ❌ Leave broken code for later |

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/fractal-chat.git
cd fractal-chat
npm install
npm run dev
```

### Useful Commands

```bash
npm run dev          # Start dev server
npm run build        # Type-check + production build
npm test             # Run tests
npm run test:watch   # Watch mode
npm run lint         # Lint
npm run preview      # Preview production build
```

## Project Structure

```
src/
├── components/
│   ├── chat/        # ChatInput, MessageBubble, MessageList
│   ├── editor/      # SubDialogPanel, SelectionMenu, TiptapRenderer
│   ├── layout/      # AppLayout, Sidebar
│   ├── model/       # ModelSelector, ModelConfigPanel
│   └── tree/        # DialogTree
├── lib/
│   ├── db.ts        # IndexedDB persistence
│   ├── types.ts     # Core type definitions
│   ├── utils.ts     # Utilities
│   ├── mergeUtils.ts
│   └── exporter.ts  # MD/JSON export
├── services/
│   ├── api.ts       # Unified API layer (OpenAI/Anthropic)
│   ├── crypto.ts    # AES-256-GCM encryption
│   └── selectionEngine.ts
├── stores/
│   ├── dialogStore.ts
│   ├── modelStore.ts
│   ├── subDialogStore.ts
│   └── uiStore.ts
└── App.tsx
```

## Questions?

Open a [GitHub Discussion](https://github.com/YOUR_USERNAME/fractal-chat/discussions) — we're happy to help!
