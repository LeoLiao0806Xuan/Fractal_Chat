import { DialogTree } from '../tree/DialogTree'

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Top bar */}
      <div className="p-2 border-b border-gray-200 flex items-center bg-white min-h-[41px]">
        <span className="text-sm font-semibold text-gray-700 px-1">💬 Fractal Chat</span>
      </div>

      {/* Dialog Tree */}
      <DialogTree />
    </aside>
  )
}
