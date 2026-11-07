// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { webcrypto } from 'node:crypto'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../src/features/auth/context/AuthProvider'
import { useAuth } from '../src/features/auth/hooks/useAuth'
import { authApi } from '../src/features/auth/services/authApi'
import { clearSession, loadSession, saveSession } from '../src/features/auth/services/sessionStore'
import { clearRequestProofKey, currentRequestProofKey, signRequest } from '../src/lib/requestProof'
import { ApiError } from '../src/lib/apiClient'
import { clearNotice, getNotice, notify } from '../src/lib/notice'

vi.mock('../src/features/auth/services/authApi', () => ({
  authApi: { login: vi.fn(), me: vi.fn(), logout: vi.fn() },
}))

Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto })

const user = { id: 7, email: 'employee@example.test', roleCode: 'EMPLOYEE' as const, employeeId: 8 }
const token = 'test.jwt.token'

function SessionView() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="user">{auth.user?.email ?? 'none'}</span>
      <span data-testid="expired">{String(auth.expired)}</span>
      <span data-testid="warning">{String(auth.storageWarning)}</span>
      <button onClick={auth.retrySession}>Retry</button>
      <button onClick={() => void auth.login(user.email, 'password')}>Login</button>
      <button onClick={() => void auth.logout()}>Logout</button>
    </div>
  )
}

async function storedSession(expiresAt = Date.now() + 30 * 60_000) {
  await signRequest('POST', '/api/auth/login', '{}')
  const key = currentRequestProofKey()!
  await saveSession({ version: 1, token, expiresAt, ...key })
  clearRequestProofKey()
  return key
}

beforeEach(async () => {
  vi.clearAllMocks()
  clearRequestProofKey()
  clearNotice()
  await clearSession()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('persistent authentication session', () => {
  it('restores a non-exportable signing key and validates /me after a reload', async () => {
    const key = await storedSession()
    vi.mocked(authApi.me).mockResolvedValue(user)
    render(
      <AuthProvider>
        <SessionView />
      </AuthProvider>,
    )

    expect(screen.getByTestId('status').textContent).toBe('checking')
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe(user.email))
    expect(vi.mocked(authApi.me)).toHaveBeenCalledWith(token)
    expect(currentRequestProofKey()?.privateKey.extractable).toBe(false)
    const headers = await signRequest('GET', '/api/auth/me')
    expect(headers['X-Request-Key']).toBe(key.publicKeyHeader)
    expect(screen.getByTestId('expired').textContent).toBe('false')
  })

  it('discards a locally expired token before calling the API', async () => {
    await storedSession(Date.now() - 1)
    render(
      <AuthProvider>
        <SessionView />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready'))
    expect(screen.getByTestId('user').textContent).toBe('none')
    expect(screen.getByTestId('expired').textContent).toBe('true')
    expect(await loadSession()).toBeNull()
    expect(authApi.me).not.toHaveBeenCalled()
  })

  it('discards an incomplete record when the signing key is missing', async () => {
    const key = await storedSession()
    await saveSession({
      version: 1,
      token,
      expiresAt: Date.now() + 60_000,
      ...key,
      privateKey: null as unknown as CryptoKey,
    })
    render(
      <AuthProvider>
        <SessionView />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready'))
    expect(screen.getByTestId('user').textContent).toBe('none')
    expect(screen.getByTestId('expired').textContent).toBe('true')
    expect(await loadSession()).toBeNull()
    expect(authApi.me).not.toHaveBeenCalled()
  })

  it('discards a rejected or deactivated account session', async () => {
    await storedSession()
    vi.mocked(authApi.me).mockRejectedValue(new ApiError(401, 'UNAUTHENTICATED', 'Inactive'))
    render(
      <AuthProvider>
        <SessionView />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('expired').textContent).toBe('true'))
    expect(screen.getByTestId('status').textContent).toBe('ready')
    expect(await loadSession()).toBeNull()
  })

  it('keeps the record during a network error and retries /me', async () => {
    await storedSession()
    vi.mocked(authApi.me)
      .mockRejectedValueOnce(new ApiError(0, 'NETWORK_ERROR', 'Offline'))
      .mockResolvedValue(user)
    render(
      <AuthProvider>
        <SessionView />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('offline'))
    expect(await loadSession()).not.toBeNull()
    fireEvent.click(screen.getByText('Retry'))
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe(user.email))
    expect(vi.mocked(authApi.me)).toHaveBeenCalledTimes(2)
  })

  it('persists a verified login and clears it on logout', async () => {
    vi.mocked(authApi.login).mockImplementation(async () => {
      await signRequest('POST', '/api/auth/login', '{}')
      return { accessToken: token, expiresIn: 1800, user }
    })
    vi.mocked(authApi.me).mockResolvedValue(user)
    vi.mocked(authApi.logout).mockResolvedValue(undefined)
    render(
      <AuthProvider>
        <SessionView />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready'))
    fireEvent.click(screen.getByText('Login'))
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe(user.email))
    expect((await loadSession())?.privateKey.extractable).toBe(false)
    fireEvent.click(screen.getByText('Logout'))
    await waitFor(async () => expect(await loadSession()).toBeNull())
    expect(screen.getByTestId('user').textContent).toBe('none')
    expect(authApi.logout).toHaveBeenCalledWith(token)
  })

  it('restores the same verified login after the provider is mounted again', async () => {
    vi.mocked(authApi.login).mockImplementation(async () => {
      await signRequest('POST', '/api/auth/login', '{}')
      return { accessToken: token, expiresIn: 1800, user }
    })
    vi.mocked(authApi.me).mockResolvedValue(user)
    const first = render(
      <AuthProvider>
        <SessionView />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready'))
    fireEvent.click(screen.getByText('Login'))
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe(user.email))
    first.unmount()
    clearRequestProofKey()

    render(
      <AuthProvider>
        <SessionView />
      </AuthProvider>,
    )
    expect(screen.getByTestId('status').textContent).toBe('checking')
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe(user.email))
    expect(vi.mocked(authApi.me)).toHaveBeenCalledTimes(2)
    expect((await signRequest('GET', '/api/auth/me'))['X-Request-Key']).toBe(
      (await loadSession())?.publicKeyHeader,
    )
  })

  it('uses the server JWT expiry when it is earlier than the response countdown', async () => {
    const exp = Math.floor(Date.now() / 1000) + 700
    const jwt = `header.${btoa(JSON.stringify({ exp }))}.signature`
    vi.mocked(authApi.login).mockImplementation(async () => {
      await signRequest('POST', '/api/auth/login', '{}')
      return { accessToken: jwt, expiresIn: 1800, user }
    })
    vi.mocked(authApi.me).mockResolvedValue(user)
    render(
      <AuthProvider>
        <SessionView />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready'))
    fireEvent.click(screen.getByText('Login'))
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe(user.email))
    expect((await loadSession())?.expiresAt).toBe(exp * 1000)
  })

  it('keeps a login usable in memory if browser storage is denied', async () => {
    vi.mocked(authApi.login).mockImplementation(async () => {
      await signRequest('POST', '/api/auth/login', '{}')
      return { accessToken: token, expiresIn: 1800, user }
    })
    vi.mocked(authApi.me).mockResolvedValue(user)
    render(
      <AuthProvider>
        <SessionView />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready'))
    vi.stubGlobal('indexedDB', undefined)
    fireEvent.click(screen.getByText('Login'))
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe(user.email))
    expect(screen.getByTestId('warning').textContent).toBe('true')
  })

  it('clears the active view when another tab broadcasts logout', async () => {
    class TestChannel {
      static peers: TestChannel[] = []
      onmessage: ((event: MessageEvent<'updated' | 'cleared'>) => void) | null = null
      constructor() {
        TestChannel.peers.push(this)
      }
      postMessage(data: 'updated' | 'cleared') {
        for (const peer of TestChannel.peers) {
          if (peer !== this) peer.onmessage?.({ data } as MessageEvent<typeof data>)
        }
      }
      close() {
        TestChannel.peers = TestChannel.peers.filter((peer) => peer !== this)
      }
    }
    vi.stubGlobal('BroadcastChannel', TestChannel)
    await storedSession()
    vi.mocked(authApi.me).mockResolvedValue(user)
    render(
      <AuthProvider>
        <SessionView />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe(user.email))
    await clearSession()
    notify('Hasil sesi lama')
    new TestChannel().postMessage('cleared')
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'))
    expect(currentRequestProofKey()).toBeNull()
    expect(getNotice()).toBeNull()
    expect(screen.getByTestId('status').textContent).toBe('ready')
  })

  it('does not revive a session after logout wins a pending /me request', async () => {
    await storedSession()
    let resolveMe!: (value: typeof user) => void
    vi.mocked(authApi.me).mockReturnValue(
      new Promise((resolve) => {
        resolveMe = resolve
      }),
    )
    render(
      <AuthProvider>
        <SessionView />
      </AuthProvider>,
    )
    await waitFor(() => expect(authApi.me).toHaveBeenCalledWith(token))
    window.dispatchEvent(new Event('absensi:session-invalid'))
    resolveMe(user)
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready'))
    expect(screen.getByTestId('user').textContent).toBe('none')
    expect(currentRequestProofKey()).toBeNull()
  })
})
