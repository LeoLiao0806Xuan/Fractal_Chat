# Contributing to Fractal Chat

First off, thanks for taking the time to contribute! 🎉

## Engineering Standards

Before modifying code, read and follow the mandatory [Engineering Standards](../docs/ENGINEERING_STANDARDS.md). It is the single source of truth for architecture boundaries, module design, code style, testing, security, and pull request acceptance criteria. New and modified code must comply with it.

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to make something great.

## How to Contribute

### 🐛 Report Bugs

1. Check [existing issues](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues) to avoid duplicates
2. Use the [bug report template](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=bug_report.md)
3. Include steps to reproduce, expected vs actual behavior, and browser/OS/version information
4. Remove API keys, private prompts, personal data, and confidential information

### 💡 Discuss Product Direction

Do not open feature-request Issues. Use the appropriate Discussion channel:

- [Ideas](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/ideas) for product suggestions grounded in a real decision workflow
- [RFC](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/rfc) for consequential product or architecture decisions
- [Q&A](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/q-a) for setup and usage questions
- [Interview](INTERVIEWS.md) for research participation and sanitized ADR/RFC workflow examples

See [FEEDBACK.md](FEEDBACK.md) for the complete routing and evidence expectations.

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
│   ├── model/       # ModelSelector
│   ├── onboarding/  # OnboardingWizard (first-run flow)
│   ├── settings/    # SettingsPanel (General/Usage/Plugins/About)
│   └── tree/        # DialogTree
├── lib/
│   ├── db.ts        # IndexedDB persistence
│   ├── types.ts     # Core type definitions
│   ├── utils.ts     # Utilities
│   ├── mergeUtils.ts
│   ├── exporter.ts  # MD/JSON export
│   └── freeProviders.ts  # Free API provider definitions
├── plugins/
│   └── char-counter.ts   # Built-in example plugin
├── services/
│   ├── api.ts       # Unified API layer (OpenAI/Anthropic)
│   ├── crypto.ts    # AES-256-GCM encryption
│   ├── selectionEngine.ts
│   └── pluginLoader.ts
├── stores/
│   ├── dialogStore.ts
│   ├── modelStore.ts
│   ├── subDialogStore.ts
│   ├── uiStore.ts
│   ├── usageStore.ts
│   └── pluginStore.ts
├── i18n/
│   ├── index.tsx    # I18nProvider + useTranslation hook
│   └── locales/     # en.json, zh.json
├── App.tsx
└── index.css
```

## Questions?

Open a [Q&A Discussion](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/q-a) — we're happy to help!
