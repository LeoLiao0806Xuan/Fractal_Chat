import { useEffect, useRef, useState } from 'react'
import { useDialogStore } from './stores/dialogStore'
import { useModelStore } from './stores/modelStore'
import { AppLayout } from './components/layout/AppLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { loadAllDialogs, saveAllDialogs, loadAllModels, saveAllModels } from './lib/db'

function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">💬</div>
        <div className="text-gray-400 text-sm">正在加载...</div>
      </div>
    </div>
  )
}

function App() {
  const dialogs = useDialogStore(s => s.dialogs)
  const createDialog = useDialogStore(s => s.createDialog)
  const initialized = useRef(false)
  const [loaded, setLoaded] = useState(false)

  // 1. Load persisted data from IndexedDB on mount
  useEffect(() => {
    Promise.all([
      loadAllDialogs().then(savedDialogs => {
        if (savedDialogs.length > 0) {
          useDialogStore.setState({ dialogs: savedDialogs, currentDialogId: savedDialogs[0].id })
        }
      }),
      loadAllModels().then(savedModels => {
        if (savedModels.length > 0) {
          useModelStore.setState({ configs: savedModels })
        }
      }),
    ]).then(() => setLoaded(true))
  }, [])

  // 2. Create default dialog if no dialogs exist after loading
  useEffect(() => {
    if (!loaded) return
    if (dialogs.length === 0 && !initialized.current) {
      initialized.current = true
      const id = createDialog('欢迎使用 Fractal Chat')
      // Add welcome message with onboarding instructions
      const { addMessage } = useDialogStore.getState()
      addMessage(id, {
        role: 'assistant',
        content: `# 🎉 欢迎使用 Fractal Chat！

Fractal Chat 是一个**多维度 AI 对话工作台**，核心功能是通过**选区**展开分支对话。

## 快速上手

### 💬 基础对话
在下方输入框打字，按 **Enter** 发送，AI 会回复你。

### 🔍 选区展开（核心功能）
1. **选中 AI 回复中的一段文字**
2. 弹出菜单 → 选择操作：
   - **深入探讨** — 对选中内容展开独立讨论
   - **Debug** — 让 AI 调试选中的代码
   - **换模型问** — 用不同模型再问一遍
   - **锚定引用** — 固定引用这段文字
3. 子对话在**右侧面板**进行，不干扰主对话
4. 讨论完后点 **「合并回主干」**，结论追加到原文

### 🌳 对话树（左侧边栏）
- 💬 = 根对话  📁 = 有子对话的对话  ↳ = 子对话
- 点击切换对话，悬停 ✕ 删除
- 侧边栏可查看**消息预览**

### ⚙️ 配置模型
点输入框旁的 ⚙️ → 设置密码 → 添加 API Key
支持 OpenAI / DeepSeek / Anthropic Claude / Gemini 等

## 提示
- 对话数据**自动保存**，刷新页面不会丢失
- 按 **Esc** 关闭弹出菜单
- 子对话支持 **取消** 发送

开始试试吧！👇`,
        parentId: null,
        branchId: 'main',
        status: 'complete',
      })
    }
  }, [loaded, dialogs.length, createDialog])

  // 3. Persist dialogs to IndexedDB (debounced 1s)
  useEffect(() => {
    if (!loaded) return
    let timer: ReturnType<typeof setTimeout>
    const unsub = useDialogStore.subscribe((state, prevState) => {
      if (state.dialogs === prevState.dialogs) return
      clearTimeout(timer)
      timer = setTimeout(() => saveAllDialogs(state.dialogs), 1000)
    })
    return () => { clearTimeout(timer); unsub() }
  }, [loaded])

  // 4. Persist model configs to IndexedDB (debounced 1s)
  useEffect(() => {
    if (!loaded) return
    let timer: ReturnType<typeof setTimeout>
    const unsub = useModelStore.subscribe((state, prevState) => {
      if (state.configs === prevState.configs) return
      clearTimeout(timer)
      timer = setTimeout(() => saveAllModels(state.configs), 1000)
    })
    return () => { clearTimeout(timer); unsub() }
  }, [loaded])

  return (
    <ErrorBoundary>
      {!loaded ? <LoadingScreen /> : <AppLayout />}
    </ErrorBoundary>
  )
}

export default App
