import type { MouseEvent, ReactNode } from 'react'
import { navigate } from '@/lib/navigation'

export function AppLink({
  to,
  children,
  className,
  ariaCurrent,
}: {
  to: string
  children: ReactNode
  className?: string
  ariaCurrent?: 'page'
}) {
  function follow(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      event.preventDefault()
      navigate(to)
    }
  }
  return (
    <a href={to} onClick={follow} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  )
}
