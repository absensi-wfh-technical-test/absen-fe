import type { KeyboardEvent } from 'react'

export function handleDialogKeyboard(event: KeyboardEvent<HTMLElement>, close: () => void) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab') return
  const buttons = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
  ]
  if (buttons.length < 2) return
  const first = buttons[0]
  const last = buttons[buttons.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

export function restoreDialogFocus(element: HTMLElement | null) {
  if (element)
    window.requestAnimationFrame(() => {
      if (element.isConnected) element.focus()
    })
}
