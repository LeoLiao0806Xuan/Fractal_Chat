<div align="center">

# 🌿 Fractal Chat

**递归对话树 + 多模型 AI 聊天**

> 选择任意文本 → 创建聚焦的子对话 → 在 GPT-4.1、Claude、DeepSeek 之间并排对比答案。

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vitejs.dev/)

</div>

---

## ✨ 功能特性

### 🧬 递归子对话树
选中回复中的任意内容 → 右键 → 创建一个聚焦的子对话。每个子对话都是一条新分支，可以继续深入挖掘，然后将结果合并回父对话。

### 🔄 多模型并行对比
将同一问题同时发送给多个 LLM，实时并排观看回复流式输出。不再需要在标签页之间手动复制粘贴。

### 🌲 可视化对话树
以交互式树状图浏览整个对话历史。折叠、展开、搜索、拖拽排序——你的上下文永远不会丢失。

- **全文搜索** 所有消息内容
- **拖拽排序** 调整对话顺序
- **折叠/展开** 保持专注
- **右键菜单** 快速操作

### 🏷️ 整理与导出
- **标签** 和 **归档** 管理对话
- **导出** 单个对话或整棵树为 Markdown / JSON
- **跨对话 @引用** — 链接到任意对话

### ✏️ 编辑与版本
- **消息编辑** 附带版本历史
- **"已编辑"时间戳** 保持透明
- **合并撤销** — 一键回退子对话合并

### 🚀 首次运行引导
- **首次打开弹出引导向导** — 选择 DeepSeek、Groq 或硅基流动
- **按语言推荐** — 中文用户看到 DeepSeek + 硅基流动；英文用户看到 DeepSeek + Groq
- **应用内配置 API Key** — 分步引导，无需到处摸索
- **"先看看演示"** — 不配也能直接试用

### ⚙️ 设置面板
- **通用标签** — 管理模型配置、加密密码
- **用量标签** — API Token 消耗追踪（进度条+百分比）
- **插件标签** — 插件管理（启用/禁用）
- **关于标签** — 版本、GitHub 链接、许可证、技术栈
- 从输入框旁的 ⚙️ 齿轮打开

---

## 🚀 快速开始

```bash
git clone https://github.com/LeoLiao0806Xuan/Fractal_Chat.git
cd fractal-chat
npm install
npm run dev
```

打开终端显示的地址 — 无需后端、无需数据库、无需注册。

### 配置模型

首次打开会自动弹出**引导向导**，帮你连接免费 AI 提供商。也可以手动配置：

1. 点击输入栏的 ⚙️
2. 设置加密密码（仅本次会话有效，AES-256-GCM）
3. 添加 API 地址（DeepSeek / Groq / OpenAI / Anthropic / Gemini / 任意兼容 OpenAI 的 API）
4. 粘贴你的 API Key — 加密后存入本地
5. 开始聊天！

> **💡 提示：** 添加多个模型后点击 **⊕ 对比** — 选择要对比的模型，一次发送给所有模型同时回复。

---

## 🏗️ 架构

Fractal Chat 是 **纯客户端** 应用。没有后端、没有用户账户、没有任何数据离开你的浏览器——除非发送到你配置的 LLM API。

```
┌──────────────────────────────────────────┐
│            React 19 + TypeScript           │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐ │
│  │ 对话树   │  │ 引导向导  │  │ 设置面板  │ │
│  │ (递归)   │  │(首次运行) │  │(标签页)   │ │
│  └────┬────┘  └──────────┘  └────┬─────┘ │
│       │                          │       │
│  ┌────▼──────────────────────────▼─────┐ │
│  │          Zustand 状态管理            │ │
│  │  dialogStore · modelStore · usageStore│ │
│  └────────────┬─────────────────────────┘ │
│       │                │                  │
│  ┌────▼────┐   ┌──────▼──────────┐      │
│  │IndexedDB│   │  API 层        │      │
│  │ (idb)   │   │ callModel()    │      │
│  │ 持久化   │   │ OAI/Anthropic │      │
│  │ +localStorage│  │ + 用量追踪    │      │
│  └─────────┘   └──────┬──────────┘      │
│                       │                  │
│              ┌────────▼────────┐        │
│              │  LLM 提供商     │        │
│              │  (你的 API 密钥)│        │
│              └─────────────────┘        │
└──────────────────────────────────────────┘
```

### 关键技术选型

| 选择 | 理由 |
|------|------|
| **纯客户端** | 零运维、零成本、完全隐私 |
| **IndexedDB** (idb) | 刷新不丢数据，无需服务器 |
| **localStorage** | UI 偏好和用量记录 |
| **Zustand** | 轻量级状态管理，无模板代码 |
| **Tiptap** | 富文本渲染，支持 Markdown |
| **AES-256-GCM** | API 密钥加密后存储 |

---

## 🧪 测试

```bash
npm test        # 运行测试 (Vitest)
npm run build   # 类型检查 + 生产构建
```

当前：**24 个测试**，覆盖 modelStore、dialogStore、mergeUtils——全部通过。

---

## 🗺️ 路线图

- [x] Phase 0 — 原型：API 统一、持久化、错误边界
- [x] Phase 1 — MVP：子对话、树导航、搜索、导出、标签
- [x] 多模型并行对比
- [x] 国际化 (i18n) — 中英双语 (2026-06-25)
- [x] 引导向导 — 按语言推荐免费提供商
- [x] 设置面板 — 通用 / 用量 / 插件 / 关于
- [x] 用量追踪 — Token 消耗进度条
- [x] 移动端适配 — 响应式布局 + 侧边栏 Drawer
- [x] 虚拟滚动 — 长对话性能优化
- [x] 插件系统 v1 — registry + 示例插件
- [ ] 对话筛选（按标签、日期、状态）
- [ ] 移动端深度优化
- [ ] 更完善的插件系统

---

## 🤝 贡献指南

欢迎贡献代码！随时提 Issue 或提交 PR。

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing`)
3. 提交你的修改 (`git commit -m 'Add amazing feature'`)
4. 推送 (`git push origin feature/amazing`)
5. 发起 Pull Request

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 📄 许可证

[Apache 2.0](LICENSE) — 个人和商业使用免费。

---

<div align="center">

**为经常和 AI 聊天的人而建 ❤️**

</div>
