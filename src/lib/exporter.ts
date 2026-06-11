import type { Dialog } from './types'

/** Download a string as a file in the browser */
function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Format a single dialog to Markdown */
function dialogToMarkdown(dialog: Dialog): string {
  const lines: string[] = []
  lines.push(`# ${dialog.title}`)
  lines.push(`> 创建: ${dialog.createdAt} ｜ 更新: ${dialog.updatedAt} ｜ 消息: ${dialog.messages.length}`)
  lines.push('')

  for (const msg of dialog.messages) {
    if (msg.role === 'system') continue
    const role = msg.role === 'user' ? '👤' : '🤖'
    const time = new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    lines.push(`### ${role} ${msg.role === 'user' ? 'User' : 'Assistant'} (${time})`)
    if (msg.model) lines.push(`> 模型: ${msg.model}`)
    lines.push('')
    lines.push(msg.content)
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  return lines.join('\n')
}

/** Build a tree of dialogs (parent → children) */
function buildDialogTree(allDialogs: Dialog[], parentId: string | null): Dialog[] {
  return allDialogs
    .filter(d => d.parentDialogId === parentId)
    .map(d => ({ ...d })) // shallow copy
}

/** Export a dialog and its sub-dialogs to Markdown */
export function exportDialogToMarkdown(dialog: Dialog, allDialogs: Dialog[]) {
  let md = dialogToMarkdown(dialog)

  // Append sub-dialogs as nested sections
  const children = buildDialogTree(allDialogs, dialog.id)
  for (const child of children) {
    md += '\n\n## 子对话: ' + child.title + '\n\n'
    md += dialogToMarkdown(child)
  }

  // Sanitize filename
  const name = dialog.title.replace(/[^a-zA-Z0-9一-鿿_-]/g, '_').slice(0, 40)
  download(`${name}.md`, md)
}

/** Export a dialog to JSON */
export function exportDialogToJSON(dialog: Dialog, allDialogs: Dialog[]) {
  const children = buildDialogTree(allDialogs, dialog.id)

  const data = {
    title: dialog.title,
    createdAt: dialog.createdAt,
    updatedAt: dialog.updatedAt,
    messages: dialog.messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role,
      content: m.content,
      model: m.model || undefined,
      createdAt: m.createdAt,
      status: m.status,
      mergedFromSubDialogId: m.mergedFromSubDialogId || undefined,
    })),
    subDialogs: children.map(child => ({
      title: child.title,
      messages: child.messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content,
        model: m.model || undefined,
        createdAt: m.createdAt,
      })),
    })),
  }

  const name = dialog.title.replace(/[^a-zA-Z0-9一-鿿_-]/g, '_').slice(0, 40)
  download(`${name}.json`, JSON.stringify(data, null, 2))
}
