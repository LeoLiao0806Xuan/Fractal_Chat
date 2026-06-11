import { DialogTree } from '../tree/DialogTree'

export function Sidebar() {
  return (
    <aside className="w-64 bg-white flex flex-col h-full">
      {/* Top bar */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h1 className="text-sm font-bold text-gray-800 tracking-tight">Fractal Chat</h1>
      </div>

      {/* Dialog Tree */}
      <DialogTree />
    </aside>
  )
}
