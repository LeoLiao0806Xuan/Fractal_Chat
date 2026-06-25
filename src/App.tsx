import { useEffect, useRef, useState } from 'react'
import { useDialogStore } from './stores/dialogStore'
import { useModelStore } from './stores/modelStore'
import { AppLayout } from './components/layout/AppLayout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { loadAllDialogs, saveAllDialogs, loadAllModels, saveAllModels } from './lib/db'
import { I18nProvider, useTranslation } from './i18n'

function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">💬</div>
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    </div>
  )
}

function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  )
}

function AppContent() {
  const { t, locale } = useTranslation()
  const dialogs = useDialogStore(s => s.dialogs)
  const createDialog = useDialogStore(s => s.createDialog)
  const initialized = useRef(false)
  const welcomeDialogId = useRef<string | null>(null)
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
      const id = createDialog(t('app.welcome'))
      welcomeDialogId.current = id
      const { addMessage } = useDialogStore.getState()
      addMessage(id, {
        role: 'assistant',
        content: t('app.welcome_msg'),
        parentId: null,
        branchId: 'main',
        status: 'complete',
      })
    }
  }, [loaded, dialogs.length, createDialog])

  // 2b. Re-translate welcome dialog when language changes
  useEffect(() => {
    if (!loaded || !welcomeDialogId.current) return
    const store = useDialogStore.getState()
    const dialog = store.dialogs.find(d => d.id === welcomeDialogId.current)
    if (!dialog) return
    store.updateDialog(welcomeDialogId.current, { title: t('app.welcome') })
    if (dialog.messages.length > 0) {
      store.updateMessage(welcomeDialogId.current, dialog.messages[0].id, { content: t('app.welcome_msg') })
    }
  }, [locale, loaded])

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
    <ErrorBoundary errorTitle={t('error.something_wrong')} errorButton={t('chat.input.reload')}>
      {!loaded ? <LoadingScreen /> : <AppLayout />}
    </ErrorBoundary>
  )
}

export default App
