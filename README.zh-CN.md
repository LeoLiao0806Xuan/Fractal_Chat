<div align="center">

# Fractal Chat

## 探索复杂技术问题，不再丢失思路

**Fractal Chat 是一个开源、本地优先的分支式多模型 AI 工作台。**

你可以从任意对话节点建立独立分支，探索不同方案、比较模型回答，并在讨论不断深入时保留清晰上下文。

**[在线体验](https://fractal-chat.netlify.app)** · **[参加异步用户研究](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=user_research.yml)** · **[打开 GitHub 仓库](https://github.com/LeoLiao0806Xuan/Fractal_Chat)**

如果希望支持或关注项目，请打开仓库后使用 GitHub 页面上的 **Star** 或 **Watch / Notifications** 按钮。

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
> Fractal Chat 目前是持续开发中的原型。在线版本展示当前的分支式对话体验，功能可能随项目开发继续变化。

## 为什么使用 Fractal Chat

长对话经常把多种方案混进同一条时间线。Fractal Chat 允许从有价值的对话节点创建独立子对话，让不同思路分别发展而不互相覆盖。

当一个技术问题存在多个可行答案、需要比较不同模型观点，或经过多轮研究后仍要保持上下文清晰时，这种方式尤其有用。

## 当前功能

- 递归对话与独立子对话分支；
- 多个已配置模型的并行流式回答；
- 支持 OpenAI 兼容接口和 Anthropic 风格供应商，并采用 BYOK；
- 对话树、搜索、标签、归档、编辑及合并/撤销；
- 本地持久化和 Markdown/JSON 对话导出；
- 中英文界面、首次使用引导、设置和响应式布局。

## 在线体验

打开 **[在线原型](https://fractal-chat.netlify.app)**，无需安装，也不需要注册 Fractal Chat 账户。

- 选择 **Skip to demo**，无需配置模型即可查看界面和示例。
- 如需发送自己的 Prompt，请使用自己的 API Key 连接受支持的模型供应商。

[v1.1 Release 页面](https://github.com/LeoLiao0806Xuan/Fractal_Chat/releases/tag/v1.1)用于查看对应版本说明和源码快照，它不是在线应用入口。

## 本地运行

使用 [`package.json`](package.json) 依赖支持的较新 Node.js/npm 环境：

```bash
git clone https://github.com/LeoLiao0806Xuan/Fractal_Chat.git fractal-chat
cd fractal-chat
npm install
npm run dev
```

打开 Vite 在终端显示的本地地址。

如需运行准确的 v1.1 源码快照，请在 `npm install` 前执行 `git checkout v1.1`。

## 配置模型

首次运行向导可以帮助连接模型供应商，也可以在设置中手动配置：

1. 设置会话加密密码。
2. 添加受支持或 OpenAI 兼容的 API 地址。
3. 提供自己的 API Key。
4. 如需并行比较，可以添加多个模型。

## 隐私与数据

Fractal Chat 是纯客户端、本地优先应用。对话数据和设置保存在浏览器中，API Key 会先加密再持久化到本地。

当 Prompt 被发送到用户配置的模型供应商或中转地址时，数据必然会离开浏览器。请检查所用供应商和端点的数据政策，不要向不可信服务提交凭据或机密信息。

## 反馈与社区

[Issues](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=bug_report.md) 用于报告可复现的 Bug。产品反馈和使用支持请进入 Discussions：

- [Ideas](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/ideas) — 基于真实工作流的产品建议；
- [RFC](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/rfc) — 影响较大的产品或架构提案；
- [Q&A](https://github.com/LeoLiao0806Xuan/Fractal_Chat/discussions/categories/q-a) — 配置和使用问题；
- [异步用户研究](https://github.com/LeoLiao0806Xuan/Fractal_Chat/issues/new?template=user_research.yml) — 无需预约会议，分享一次脱敏后的近期技术决策。

发帖前请阅读 [FEEDBACK.md](FEEDBACK.md)。这是公开仓库，请勿提交 API Key、个人数据、私人对话或雇主机密信息。

## 开发与质量

提交变更前运行：

```bash
npm run lint
npm test
npm run build
```

架构、TypeScript、测试、隐私、迁移和验收要求由项目工程规范统一管理。修改产品代码前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 参与贡献

欢迎改善现有用户体验、可靠性、可访问性、供应商兼容性、文档或测试覆盖率的贡献。开始大型功能或架构调整前，请先建立 Issue 或 Discussion。

## 许可证

[Apache 2.0](LICENSE) — 个人和商业使用免费。
