# Fractal Chat Feedback and Community Routing

Fractal Chat uses different channels for different kinds of feedback so bugs remain actionable, product discovery remains open, and consequential decisions receive deliberate review.

## Choose the right channel

| Channel | Use it for | Do not use it for |
| :--- | :--- | :--- |
| [Issues — Bug](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=bug_report.md) | Reproducible behavior where the product does not work as intended | Feature requests, open-ended questions, strategy debates |
| [Discussions — Ideas](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/ideas) | Product suggestions grounded in a real technical decision workflow | Bugs or large proposals that change product/architecture boundaries |
| [Discussions — RFC](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/rfc) | Important product and architecture decisions with alternatives, evidence, risks, and migration impact | Small suggestions or support requests |
| [Discussions — Q&A](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/q-a) | Setup, configuration, and usage questions | Reproducible defects or product proposals |
| [Asynchronous user research](INTERVIEWS.md) | Complete the electronic questionnaire or share sanitized workflow examples without scheduling a meeting | Support requests, sales requests, private contact details, or confidential company material |

## How proposals are evaluated

A suggestion is not prioritized only because it is useful. Product feedback is evaluated against the same core task:

> Does this help technical teams compare alternatives, organize evidence, challenge assumptions, or produce a reviewable decision record?

Useful evidence includes a recent real decision, its cost or risk, the alternatives considered, the current workaround, where review broke down, and what outcome would materially improve.

RFCs should additionally explain:

- the decision boundary and non-goals;
- confirmed facts, external evidence, assumptions, and unknowns;
- viable alternatives, including keeping the current behavior;
- user, data, architecture, privacy, and migration impact;
- risks, dissenting views, reversibility, and validation criteria.

## Safety and privacy

This is a public repository. Never post API keys, authorization headers, private prompts or conversations, personal data, internal endpoints, unreleased source code, or employer-confidential information. Replace identifying details with a minimal sanitized example.

Security vulnerabilities that could put users at risk should not be disclosed in a public Issue or Discussion. Use the repository's private security reporting channel when it is available.

## Maintainer routing

Misrouted feedback may be transferred or closed with a link to the correct channel. That is routing, not rejection. A Discussion may become an RFC after its impact is understood; a reproducible failure discovered in Q&A may become a Bug Issue.
