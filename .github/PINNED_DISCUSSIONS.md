# Initial Pinned Discussions

These are the canonical launch drafts for the first four pinned GitHub Discussions. Publish them to the category shown, then pin all four from the repository Discussions moderation menu.

Before publishing, configure these categories:

| Category | Format | Description |
| :--- | :--- | :--- |
| Ideas | Open-ended discussion | Product suggestions grounded in real technical decision workflows |
| RFC | Open-ended discussion | Important product and architecture decisions with alternatives and trade-offs |
| Q&A | Question and answer | Setup, configuration, and usage questions |
| Interview | Open-ended discussion | Asynchronous research updates and sanitized workflow examples |

---

## Ideas — What technical decision did you struggle with recently?

Technical decisions often become difficult before they become visible: alternatives are spread across tabs, evidence has different levels of trust, AI tools disagree, and the final explanation is assembled manually at the end.

We want to understand a recent decision that was genuinely hard—not collect a feature wish list.

If you can share a sanitized example, tell us:

1. What had to be decided, and why did it matter?
2. Which alternatives were seriously considered?
3. What made the decision costly, controversial, or difficult to reverse?
4. Where did evidence, assumptions, or expert opinions conflict?
5. Which tools and artifacts did you use?
6. What had to be rewritten or explained for review?
7. What would have made the process more reliable?

Please remove company names, private system details, personal information, credentials, and confidential material. The structure of the decision is more valuable than identifying detail.

---

## RFC — Fractal Chat product direction and validation goals

Fractal Chat is evolving from a tree-based multi-model chat prototype into an open-source, local-first AI decision workbench.

Our focused promise is:

> Help technical teams compare alternatives, organize evidence, challenge assumptions, and produce reviewable decision records.

The product is not trying to become a general AI assistant, knowledge base, project manager, document editor, and collaboration suite at the same time. Chat, branches, multiple models, search, export, and integrations are supporting mechanisms. The completion point is a decision record another person can inspect and challenge.

Phase A is intended to validate one end-to-end loop:

```text
Frame the decision
  → preserve alternatives and risks
  → gather independent perspectives
  → separate evidence, opinions, inferences, and unknowns
  → compare disagreements and trade-offs
  → produce and export a reviewable draft
  → let the user confirm or revisit the decision
```

The initial validation goals are:

- 12–15 task-qualified interviews;
- 8 design partners;
- at least 5 real decision drafts shared for review;
- evidence of repeat use on a second real decision;
- concrete willingness-to-pay or paid-pilot signals;
- no blocking data-loss, branching, or streaming failures in the core path.

We would especially value challenges to these assumptions:

1. Is a reviewable decision record the right completion point?
2. Where would this workflow create extra work instead of reducing it?
3. Which evidence boundaries are necessary for trust?
4. What should remain outside the product and be handled through integrations?
5. What observable result would convince you that the product improves decision quality or efficiency?

Strong disagreement and counterexamples are welcome. This thread is a living product RFC, not a marketing announcement.

---

## Ideas — Share an example ADR or RFC workflow

Fractal Chat aims to produce decision records that fit real engineering review—not invent a template in isolation.

Please share a sanitized description of how your team handles ADRs, RFCs, technical proposals, architecture reviews, or equivalent artifacts.

Useful details include:

- what triggers a formal record;
- who authors, reviews, challenges, and approves it;
- which sections are required;
- how alternatives and rejected options are documented;
- how sources, benchmarks, experiments, and assumptions are attached;
- where discussion happens and where the final record lives;
- how long the process usually takes;
- how decisions are superseded or revisited;
- where the workflow creates duplication, delay, or loss of context.

Templates and public examples are welcome. For internal workflows, describe only the structure and remove identifying or confidential information.

---

## Interview — Share a recent technical decision asynchronously

We are collecting asynchronous research responses about one recent, high-cost technical decision. The electronic questionnaire takes about 10–15 minutes and does not require a meeting.

You may be a good fit if, during the last 30 days, you compared multiple technical options, had to document or defend the outcome, and faced meaningful delivery, cost, security, operational, or architectural risk. Job title does not matter.

We will ask about:

- what triggered the decision;
- alternatives and constraints;
- sources, experiments, and AI tools used;
- disagreements, unknowns, and review;
- time spent organizing or rewriting the result;
- what happened after the decision.

This is product research, not customer support, a sales call, or employment screening. You do not need to be a Fractal Chat user. Do not disclose employer-confidential information; anonymized workflows are sufficient. Responses are submitted publicly through GitHub, so private contact details and secrets must be omitted.

Read [INTERVIEWS.md](../INTERVIEWS.md) for the research boundaries, then complete the [asynchronous user research questionnaire](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=user_research.yml). The Interview category remains available for public research questions and sanitized workflow examples.
