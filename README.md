<div align="center">

# Fractal Chat

## Make complex technical decisions reviewable

**Fractal Chat is an open-source, local-first AI decision workbench.**

Fractal Chat helps technical teams compare alternatives, organize evidence, challenge assumptions, and produce reviewable decision records.

Built for technical teams facing high-cost, multi-option decisions that must be explained, reviewed, and revisited—not for collecting more AI answers.

**[Try Release v1.1](https://github.com/LeoLiao0806Xuan/Fractal_Chat/releases/tag/v1.1)** · **[Join the asynchronous user research](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=user_research.yml)** · **[Star / Watch the project](https://github.com/LeoLiao0806Xuan/Fractal_Chat)**

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
> **Fractal Chat is undergoing a major product transition.** The current application is a working tree-based, multi-model chat prototype. Phase A is turning that foundation into an end-to-end decision workbench. The online prototype does not yet contain every decision capability described below.

## Why Fractal Chat

Linear AI chat is useful for producing answers, but complex technical decisions require more than an answer. Alternatives diverge, models disagree, evidence has different levels of trust, and the result must often survive review by someone else.

Fractal Chat is designed for decisions that are:

- costly to reverse;
- based on multiple viable options;
- disputed or uncertain;
- expected to be documented, reviewed, or explained;
- exposed to meaningful delivery, financial, security, or architectural risk.

The product promise is deliberately narrow:

> Help a user produce a reviewable, traceable technical decision draft with clear evidence boundaries.

Fractal Chat helps make the **process and artifact** more reliable. It does not claim to automatically produce the one correct decision, verify every source, replace real-world testing, or assume responsibility for the outcome.

## The decision loop

```text
Frame the question and constraints
  → preserve alternatives, assumptions, counterexamples, and risks as branches
  → obtain independent perspectives from roles, approaches, or models
  → separate user facts, external evidence, model opinions, inferences, and unknowns
  → compare disagreements, trade-offs, and evidence gaps
  → synthesize a recommendation without hiding the dissenting case
  → export a reviewable ADR or Markdown decision draft
  → let the user confirm, replace, or revisit the decision
```

The tree is a mechanism for exploration, not the final product. The completion point is a decision draft that another person can inspect and challenge.

## Project status

Fractal Chat is currently a **foundation prototype moving toward its first decision-workbench MVP**.

### Available today

- Recursive conversations and multiple independent sub-dialogue branches;
- parallel, streaming responses from multiple configured models;
- OpenAI-compatible and Anthropic-style provider support with BYOK;
- visual tree navigation, search, tags, archive, editing, and merge/undo;
- local persistence plus Markdown and JSON conversation export;
- English and Chinese UI, onboarding, settings, usage display, and responsive layout;
- buffered SSE parsing and local-only structural telemetry contracts for Phase A reliability work.

### Being built in Phase A

- a first-class `Decision` object with context, constraints, criteria, and explicit status;
- typed branches for options, claims, risks, counterarguments, and unknowns;
- evidence boundaries that distinguish sources from model-generated opinions;
- disagreement comparison and editable synthesis;
- versioned ADR and Markdown decision-draft export;
- user-confirmed completion and a traceable path from source dialogue to decision record;
- versioned, incremental local persistence for decision entities.

Until those Phase A items are complete, the repository should be evaluated as a capable conversation prototype and engineering foundation—not as a finished decision product.

## Who it is for

Seniority is not the admission criterion. Fractal Chat is for anyone who recently had to make a high-cost, multi-option technical decision and explain it to others.

Likely early users include:

- senior and mid-level software engineers;
- tech leads, staff engineers, architects, and engineering managers;
- independent developers, founders, and open-source maintainers;
- platform, data, security, infrastructure, and operations engineers;
- technical product managers, consultants, and solution architects.

Senior engineers remain a useful beachhead because these tasks occur frequently and carry visible consequences. The long-term boundary is defined by the task, not the job title.

## Product principles

### One workflow, progressive depth

Users begin with a normal question. Structure appears only when it helps: constraints, options, evidence, risks, dissent, and advanced model controls all feed the same decision model and the same completion state. Fractal Chat is not building separate Quick, Guided, and Expert products.

### Centralized capabilities, focused promise

Chat, search, branching, multiple models, export, and integrations can support the workbench. A capability belongs in the core only if it improves completion or quality of the same decision loop. Fractal Chat is not trying to rebuild a general-purpose chat client, knowledge base, project manager, document editor, and collaboration suite in one application.

### Evidence is not consensus

Several models repeating the same claim does not turn that claim into evidence. The product is moving toward explicit treatment of:

| Type | Meaning |
| :--- | :--- |
| User fact | A constraint or fact confirmed by the user |
| External evidence | A checkable document, test, benchmark, paper, or code reference |
| Model opinion | A model-generated claim that remains unverified by default |
| Inference | A conclusion derived from facts or evidence |
| Unknown | An unresolved assumption that could change the decision |

### Local first, user controlled

The first phase remains client-side and BYOK. Core data is stored locally, and the user owns the data and export path. Prompts necessarily leave the browser when sent to model providers configured by the user. Optional cloud services must remain explicit and separable from the local core.

## Quick start

Requirements: a recent Node.js/npm environment supported by the dependencies in [`package.json`](package.json).

```bash
git clone https://github.com/LeoLiao0806Xuan/Fractal_Chat.git fractal-chat
cd fractal-chat
npm install
npm run dev
```

Open the local URL printed by Vite. No Fractal Chat account or application backend is required.

### Configure a model

The first-run wizard can help connect a provider, or you can configure one from Settings:

1. Set the session encryption password.
2. Add a supported or OpenAI-compatible API endpoint.
3. Provide your own API key.
4. Add multiple models if you want parallel comparison.

API keys are encrypted in the browser before local persistence. Do not use an untrusted relay or endpoint, and review the data policy of every model provider you configure.

## Architecture direction

The repository is being migrated progressively toward a one-way layered architecture:

```text
Presentation
  One progressive workflow: question → structure → review
        ↓
Application
  CreateDecision / AddBranch / RunPerspective / AttachEvidence
  BuildDraft / TransitionStatus / ExportDecision
   ├──→ Domain
   │     Decision / Branch / Evidence / Synthesis / DecisionRecord
   └──→ Ports
         DecisionRepository / ModelProvider / Exporter / Telemetry
              ↑
         Infrastructure
         IndexedDB / Provider adapters / Export / Optional cloud
```

The existing React/Zustand conversation implementation is the migration source, not the target architecture. New and modified code follows the repository's atomic module and dependency-boundary standards.

## Evidence-gated roadmap

| Phase | Outcome | Unlock condition |
| :--- | :--- | :--- |
| **A — Decision loop** | A real technical question becomes a reviewable decision draft | Design partners complete and export real decisions without blocking failures |
| **B — Sharing and workflow connections** | Decisions can be reviewed, reused, and connected to engineering work | Phase A shows external review and repeat use |
| **C — Pro and continuity** | Encrypted sync, version comparison, reminders, and selected automation | Retention and willingness-to-pay are demonstrated |
| **D — Team governance** | Shared spaces, review, permissions, audit, and a possible second vertical | Paid team demand is demonstrated |

Features are not promoted merely because they are useful. Each roadmap item must improve activation, completion, review, repeat use, or willingness to pay for the core decision task.

## Feedback and community

Use [Issues](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=bug_report.md) only for reproducible bugs. Product discovery and support happen in Discussions:

- [Ideas](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/ideas) — product suggestions grounded in a real decision workflow;
- [RFC](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/rfc) — important product and architecture decisions;
- [Q&A](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/q-a) — setup and usage questions;
- [Take the asynchronous research survey](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=user_research.yml) — share a sanitized recent technical decision without scheduling a meeting.

Read [FEEDBACK.md](FEEDBACK.md) before posting. It explains routing, evidence expectations, and public-repository privacy boundaries.

## Development and quality

Before submitting a change, run:

```bash
npm run lint
npm test
npm run build
```

Architecture, TypeScript, testing, privacy, migration, and acceptance rules are defined by the project's engineering standards. Please read the repository guidance and [contributing guide](CONTRIBUTING.md) before modifying product code.

## Contributing

Contributions are welcome when they strengthen the same decision workflow, improve reliability, or make the product easier to validate with real users. Please open an issue before starting a large feature or architectural change so its product evidence and module boundary can be agreed first.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.

## License

[Apache 2.0](LICENSE) — free for personal and commercial use.

---

<div align="center">

**The underlying capabilities can expand. The user promise stays focused.**

</div>
