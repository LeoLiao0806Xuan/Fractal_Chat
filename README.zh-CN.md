<div align="center">

# Fractal Chat

## 让复杂技术决策变得可评审

**Fractal Chat 是一个开源、本地优先的 AI 决策工作台。**

Fractal Chat 帮助技术团队比较替代方案、整理证据、挑战假设，并形成可评审的决策记录。

它服务需要解释、评审和复查的高成本、多方案技术决策，而不是帮助用户积累更多 AI 回答。

**[体验 Release v1.1](https://github.com/LeoLiao0806Xuan/Fractal_Chat/releases/tag/v1.1)** · **[参加异步用户研究](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=user_research.yml)** · **[Star / Watch 项目](https://github.com/LeoLiao0806Xuan/Fractal_Chat)**

[English](README.md)

</div>

---

<div align="center">

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vite.dev/)

</div>

> [!IMPORTANT]
> **Fractal Chat 正在进行一次重要的产品升级。** 当前应用是可运行的树形多模型聊天原型；Phase A 正在把这套基础升级为端到端决策工作台。在线原型尚未包含下文描述的全部决策能力。

## 从分散回答到决策记录

复杂技术决策很少缺少答案，真正缺少的是可以被检查的判断过程：有哪些方案、依据来自哪里、哪些只是模型观点、什么条件可能推翻结论，以及为什么最终选择这一条路径。

Fractal Chat 将这些工作组织成一个闭环：

```text
明确问题、背景和约束
  → 用分支保留方案、假设、反例、风险和未知项
  → 从不同角色、方法或模型获得独立观点
  → 区分用户事实、外部证据、模型观点、推断和未知项
  → 比较分歧、取舍、风险和证据缺口
  → 形成综合建议，同时保留反方意见
  → 导出可评审的 ADR 或 Markdown 决策草案
  → 由用户确认、替代或在条件变化后复查决定
```

树是探索机制，不是产品终点。真正的完成状态，是得到一份能够交给另一个人检查和质疑的决策草案。

## 适用场景

当一项技术任务同时具备以下特征时，Fractal Chat 最有价值：

- 决策错误或反悔成本较高；
- 存在多个可行方案；
- 结论具有争议或不确定性；
- 必须形成文档、接受评审或向他人解释；
- 会带来明显的交付、成本、安全或架构风险。

典型场景包括架构选型、平台迁移、自建与采购比较、数据库或消息系统选择、安全方案评审、性能与成本权衡，以及需要形成 ADR、RFC 或技术提案的工作。

职级不是准入条件。早期用户可能是中高级工程师、Tech Lead、架构师、工程经理、独立开发者、开源维护者，以及平台、数据、安全或基础设施团队成员。产品边界由任务决定，不由职位名称决定。

## 产品承诺与责任边界

Fractal Chat 提高的是**决策过程和交付物的确定性**：

- 重要替代方案不会轻易消失在线性聊天里；
- 模型观点不会被伪装成外部证据；
- 风险、反方、未知项和证据缺口不会在综合时被自动隐藏；
- 草案中的来源、状态和用户确认动作可以追溯；
- 用户可以通过开放格式带走数据。

它不承诺自动找到全部方案、验证所有来源、给出唯一正确决定，也不替代真实环境测试、安全审查和最终责任人。

## 项目现状

Fractal Chat 当前处于**基础原型向首个决策工作台 MVP 迁移**的阶段。

| 当前已经具备 | Phase A 正在建设 |
| :--- | :--- |
| 递归对话与多个独立子分支 | `Decision` 领域对象与明确状态 |
| 多模型并行流式回复与 BYOK | 方案、主张、风险、反方和未知项 |
| 对话树、搜索、标签、归档和编辑 | 外部证据与模型观点的明确边界 |
| 本地持久化与对话 Markdown/JSON 导出 | 分歧比较与可编辑综合结论 |
| 中英文界面、引导、设置和响应式布局 | 带版本的 ADR/Markdown 决策记录 |
| 缓冲式 SSE 解析与本地结构事件契约 | 增量式决策实体存储与迁移 |

在 Phase A 完成前，应把本仓库视为一个能力较完整的树形聊天原型和工程底座，而不是已经完成的决策产品。

## 为什么不是另一个全能 AI 工具

聊天、搜索、分支、多模型、导出和集成都可以成为底层能力，但它们必须服务同一个用户承诺：完成一份可评审、可追溯的技术决策记录。

Fractal Chat 不打算同时重建通用聊天、知识库、项目管理、文档编辑和协作平台。用户从普通问题开始，约束、证据、风险、反方和高级模型控制按需出现；所有入口共享同一个数据模型和完成状态，而不是拆成互不兼容的 Quick、Guided 和 Expert 三套产品。

## 模型共识不等于证据

多个模型重复相似观点，并不会让观点自动成为证据：

| 类型 | 含义 |
| :--- | :--- |
| 用户事实 | 由用户确认的条件、约束或事实 |
| 外部证据 | 可核查的文档、测试、基准、论文或代码引用 |
| 模型观点 | 默认仍待验证的模型生成主张 |
| 推断 | 基于事实或证据形成的判断 |
| 未知项 | 可能改变结论但尚未解决的假设 |

## 快速开始

使用 [`package.json`](package.json) 中依赖支持的较新 Node.js/npm 环境：

```bash
git clone https://github.com/LeoLiao0806Xuan/Fractal_Chat.git fractal-chat
cd fractal-chat
npm install
npm run dev
```

打开 Vite 在终端显示的本地地址。应用不需要 Fractal Chat 账户或产品后端。

首次运行向导可以帮助连接模型供应商，也可以在设置中手动配置 API 地址和自己的 API Key。API Key 会先在浏览器中加密，再持久化到本地。Prompt 发送给用户配置的模型供应商时必然会离开浏览器，请自行检查供应商和中转地址的数据政策。

## 架构方向

仓库正在渐进迁移到单向分层架构：

```text
Presentation
  单一渐进工作流：问题 → 结构 → 评审
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
         IndexedDB / Provider Adapter / Export / Optional Cloud
```

现有 React/Zustand 对话实现是迁移起点，不是目标架构。所有新增和修改代码都应遵循仓库的原子模块和依赖边界规范。

## 由证据解锁的路线图

| 阶段 | 目标结果 | 解锁条件 |
| :--- | :--- | :--- |
| **Phase A — 决策闭环** | 一个真实技术问题形成可评审决策草案 | 设计伙伴能够无阻塞地完成并导出真实 Decision |
| **Phase B — 传播与工作流连接** | 决策能够被评审、复用并连接工程流程 | Phase A 出现外部评审和重复使用 |
| **Phase C — Pro 与持续价值** | 加密同步、版本比较、提醒和有限自动化 | 留存和付费意愿得到验证 |
| **Phase D — 团队治理** | 共享空间、评审、权限、审计及可能的第二垂直 | 团队付费需求得到验证 |

功能不会仅仅因为“有用”就自动进入路线图。每项工作必须改善核心决策任务的激活、完成、评审、重复使用或付费信号。

## 反馈与社区

[Issues](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=bug_report.md) 只接收可复现的 Bug。产品探索与使用支持进入 Discussions：

- [Ideas](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/ideas) — 基于真实决策工作流的产品建议；
- [RFC](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/rfc) — 重要产品与架构决策；
- [Q&A](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/q-a) — 配置和使用问题；
- [填写异步用户研究问卷](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=user_research.yml) — 无需预约会议，分享一次脱敏后的近期技术决策。

发帖前请阅读 [FEEDBACK.md](FEEDBACK.md)，了解分流规则、证据要求和公开仓库的隐私边界。

## 开发与贡献

提交变更前运行：

```bash
npm run lint
npm test
npm run build
```

架构、TypeScript、测试、隐私、迁移和验收要求统一由项目工程规范管理。修改产品代码前，请完整阅读仓库说明和[贡献指南](CONTRIBUTING.md)。

欢迎能够强化同一决策工作流、提高可靠性或帮助真实用户验证产品的贡献。开始大型功能或架构调整前，请先建立 Issue，确认它对应的产品证据和模块边界。

## 许可证

[Apache 2.0](LICENSE) — 个人和商业使用免费。

---

<div align="center">

**功能集中产生便利，任务聚焦产生信任。**

</div>
