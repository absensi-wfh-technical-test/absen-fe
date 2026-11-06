export interface Notice { id: number; message: string; kind: 'success' | 'info' | 'error' }
let current: Notice | null = null
let id = 0
const listeners = new Set<() => void>()
export function notify(message: string, kind: Notice['kind'] = 'success') {
  current = { id: ++id, message, kind }
  listeners.forEach(listener => listener())
}
export function clearNotice() { current = null; listeners.forEach(listener => listener()) }
export function subscribeNotice(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
export function getNotice() { return current }
