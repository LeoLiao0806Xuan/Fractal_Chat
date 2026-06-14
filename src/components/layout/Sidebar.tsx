import { DialogTree } from '../tree/DialogTree'

export function Sidebar() {
  return (
    <aside className="bg-[#faf9fe] flex flex-col h-full">
      {/* Brand header */}
      <div className="px-4 py-4 border-b border-[#f0eff5]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                          flex items-center justify-center text-white text-xs font-bold shadow-sm
                          shadow-indigo-200/30">
            ◈
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#171717] tracking-tight">Fractal Chat</h1>
            <p className="text-[10px] text-[#a3a3a3] font-medium">AI 对话工作台</p>
          </div>
        </div>
      </div>

      {/* Dialog Tree */}
      <DialogTree />
    </aside>
  )
}
