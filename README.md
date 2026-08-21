<div align="center">

# Fractal Chat

## Explore complex technical questions without losing the thread

**Fractal Chat is an open-source, local-first AI workspace for branching conversations and multi-model exploration.**

Use separate branches to investigate alternatives, compare model responses, and preserve useful context as a technical discussion evolves.

**[Try the live prototype](https://fractal-chat.netlify.app)** · **[Join the asynchronous user research](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=user_research.yml)** · **[Open the GitHub repository](https://github.com/LeoLiao0806Xuan/Fractal_Chat)**

To support or follow the project, open the repository and use GitHub's **Star** or **Watch / Notifications** controls.

[简体中文](README.zh-CN.md)

</div>

---

<div align="center">

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vite.dev/)

</div>

> [!IMPORTANT]
> Fractal Chat is an active prototype. The live version demonstrates the current branching conversation experience and may change as the project develops.

## Why Fractal Chat

Long AI conversations often mix several approaches into one timeline. Fractal Chat keeps exploration organized by allowing a useful point in the conversation to become its own sub-dialogue.

This is especially useful when a technical question has multiple plausible answers, benefits from different model perspectives, or needs to remain understandable after several rounds of investigation.

## Available today

- Recursive conversations with independent sub-dialogue branches;
- parallel and streaming responses from multiple configured models;
- OpenAI-compatible and Anthropic-style provider support with BYOK;
- visual tree navigation, search, tags, archive, editing, and merge/undo;
- local persistence and Markdown/JSON conversation export;
- English and Chinese UI, onboarding, settings, and responsive layout.

## Try it online

Open the **[live prototype](https://fractal-chat.netlify.app)**. No installation or Fractal Chat account is required.

- Choose **Skip to demo** to explore the interface without configuring a model.
- To send your own prompts, connect a supported model provider with your own API key.

The [v1.1 release page](https://github.com/LeoLiao0806Xuan/Fractal_Chat/releases/tag/v1.1) contains the corresponding version information and source snapshot; it is not the hosted application.

## Run locally

Use a recent Node.js/npm environment supported by the dependencies in [`package.json`](package.json):

```bash
git clone https://github.com/LeoLiao0806Xuan/Fractal_Chat.git fractal-chat
cd fractal-chat
npm install
npm run dev
```

Open the local URL printed by Vite.

To run the exact v1.1 source snapshot, use `git checkout v1.1` before `npm install`.

## Configure a model

The first-run wizard can help connect a provider, or you can configure one from Settings:

1. Set the session encryption password.
2. Add a supported or OpenAI-compatible API endpoint.
3. Provide your own API key.
4. Add multiple models if you want parallel comparison.

## Privacy and data

Fractal Chat is client-side and local-first. Conversation data and settings are stored in the browser, and API keys are encrypted before local persistence.

Prompts necessarily leave the browser when they are sent to model providers or relay endpoints configured by the user. Review the data policy of every provider and endpoint you use, and never submit credentials or confidential material to an untrusted service.

## Feedback and community

Use [Issues](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=bug_report.md) for reproducible bugs. Product feedback and support belong in Discussions:

- [Ideas](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/ideas) — product suggestions grounded in a real workflow;
- [RFC](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/rfc) — consequential product or architecture proposals;
- [Q&A](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/q-a) — setup and usage questions;
- [Asynchronous user research](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=user_research.yml) — share a sanitized recent technical decision without scheduling a meeting.

Read [FEEDBACK.md](FEEDBACK.md) before posting. This is a public repository: do not include API keys, personal data, private conversations, or employer-confidential information.

## Development and quality

Before submitting a change, run:

```bash
npm run lint
npm test
npm run build
```

Architecture, TypeScript, testing, privacy, migration, and acceptance rules are defined by the project's engineering standards. See [CONTRIBUTING.md](CONTRIBUTING.md) before modifying product code.

## Contributing

Contributions that improve the current user experience, reliability, accessibility, provider compatibility, documentation, or test coverage are welcome. Open an Issue or Discussion before starting a large feature or architectural change.

## License

[Apache 2.0](LICENSE) — free for personal and commercial use.
