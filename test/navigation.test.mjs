import assert from 'node:assert/strict'
import { test } from 'node:test'

const browser = new EventTarget()
browser.location = { pathname: '/admin/karyawan/baru' }
browser.history = {
  pushState(_state, _unused, path) {
    browser.location.pathname = path
  },
}
globalThis.window = browser

const { addNavigationBlocker, navigate, requestGuardedAction } = await import(
  '../src/lib/navigation.ts'
)
const { handleDialogKeyboard, restoreDialogFocus } = await import(
  '../src/components/ui/dialogKeyboard.ts'
)

test('navigasi form menahan link dan browser back saat perubahan belum disimpan', () => {
  let prompts = 0
  const remove = addNavigationBlocker(() => {
    prompts += 1
    return false
  })
  assert.equal(navigate('/admin/karyawan'), false)
  assert.equal(browser.location.pathname, '/admin/karyawan/baru')

  browser.location.pathname = '/admin/absensi'
  browser.dispatchEvent(new Event('popstate'))
  assert.equal(browser.location.pathname, '/admin/karyawan/baru')
  assert.equal(prompts, 2)

  remove()
  assert.equal(navigate('/admin/karyawan'), true)
  assert.equal(browser.location.pathname, '/admin/karyawan')
})

test('aksi logout tertunda sampai pengguna menyetujui dialog form', () => {
  let deferred
  let executed = false
  const remove = addNavigationBlocker((_target, proceed) => {
    deferred = proceed
    return false
  })
  assert.equal(
    requestGuardedAction('/login', () => {
      executed = true
    }),
    false,
  )
  assert.equal(executed, false)
  remove()
  deferred()
  assert.equal(executed, true)
})

test('redirect setelah sesi berakhir tidak ditahan oleh form yang sudah tidak dapat disimpan', () => {
  const remove = addNavigationBlocker(() => false)
  assert.equal(navigate('/login', { sessionRedirect: true }), true)
  assert.equal(browser.location.pathname, '/login')
  remove()
})

test('dialog menjaga fokus Tab dan dapat ditutup dengan Escape', () => {
  const first = {
    focus() {
      document.activeElement = first
    },
  }
  const last = {
    focus() {
      document.activeElement = last
    },
  }
  globalThis.document = { activeElement: last }
  let prevented = 0
  let closed = false
  const event = {
    key: 'Tab',
    shiftKey: false,
    currentTarget: { querySelectorAll: () => [first, last] },
    preventDefault() {
      prevented += 1
    },
  }
  handleDialogKeyboard(event, () => {
    closed = true
  })
  assert.equal(document.activeElement, first)
  event.shiftKey = true
  handleDialogKeyboard(event, () => {
    closed = true
  })
  assert.equal(document.activeElement, last)
  event.key = 'Escape'
  handleDialogKeyboard(event, () => {
    closed = true
  })
  assert.equal(closed, true)
  assert.equal(prevented, 3)
})

test('fokus kembali ke tombol pemicu saat dialog dibatalkan', () => {
  browser.requestAnimationFrame = (callback) => callback()
  let focused = false
  restoreDialogFocus({
    isConnected: true,
    focus() {
      focused = true
    },
  })
  assert.equal(focused, true)
})
