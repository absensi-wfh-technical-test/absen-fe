import { useSyncExternalStore } from 'react'

const changed = 'absensi:navigate'
const blockers = new Set<(target: string, proceed: () => void) => boolean>()
let currentPath = window.location.pathname
const canLeave = (target: string, proceed: () => void) => [...blockers].every(blocker => blocker(target, proceed))
const commitPath = (path: string) => {
  window.history.pushState(null, '', path)
  currentPath = path
  window.dispatchEvent(new Event(changed))
}
window.addEventListener('popstate', () => {
  const target = window.location.pathname
  if (target !== currentPath && !canLeave(target, () => commitPath(target))) {
    window.history.pushState(null, '', currentPath)
    return
  }
  currentPath = target
})
const subscribe = (listener: () => void) => {
  window.addEventListener('popstate', listener)
  window.addEventListener(changed, listener)
  return () => { window.removeEventListener('popstate', listener); window.removeEventListener(changed, listener) }
}
const getPath = () => window.location.pathname

export function usePathname(): string { return useSyncExternalStore(subscribe, getPath) }

export function addNavigationBlocker(blocker: (target: string, proceed: () => void) => boolean) {
  blockers.add(blocker)
  return () => { blockers.delete(blocker) }
}

export function requestGuardedAction(target: string, action: () => void) {
  if (!canLeave(target, action)) return false
  action()
  return true
}

export function navigate(path: string, options?: { sessionRedirect?: boolean }) {
  if (window.location.pathname !== path) {
    if (options?.sessionRedirect) { commitPath(path); return true }
    return requestGuardedAction(path, () => commitPath(path))
  }
  window.dispatchEvent(new Event(changed))
  return true
}

