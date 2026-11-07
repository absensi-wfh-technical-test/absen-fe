let keyPair: CryptoKeyPair | null = null
let publicKeyHeader: string | null = null

export interface RequestProofKey {
  privateKey: CryptoKey
  publicKey: CryptoKey
  publicKeyHeader: string
}

export function currentRequestProofKey(): RequestProofKey | null {
  return keyPair && publicKeyHeader ? { ...keyPair, publicKeyHeader } : null
}

export function restoreRequestProofKey(saved: RequestProofKey): void {
  keyPair = { privateKey: saved.privateKey, publicKey: saved.publicKey }
  publicKeyHeader = saved.publicKeyHeader
}

function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function ensureKey(): Promise<CryptoKeyPair> {
  if (!keyPair) {
    keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, [
      'sign',
      'verify',
    ])
    const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)
    publicKeyHeader = base64url(new TextEncoder().encode(JSON.stringify(jwk)))
  }
  return keyPair
}

export async function signRequest(
  method: string,
  target: string,
  body?: BodyInit | null,
): Promise<Record<string, string>> {
  let bodyBytes: Uint8Array
  let version = 'v1'
  if (body instanceof FormData) {
    const photo = body.getAll('photo')
    if (
      photo.length !== 1 ||
      !(photo[0] instanceof File) ||
      Array.from(body.keys()).some((key) => key !== 'photo')
    ) {
      throw new Error('Form foto harus berisi tepat satu berkas photo.')
    }
    bodyBytes = new Uint8Array(await photo[0].arrayBuffer())
    version = 'v2'
  } else if (body === undefined || body === null || typeof body === 'string') {
    bodyBytes = new TextEncoder().encode(body ?? '')
  } else throw new Error('Format body request tidak didukung.')
  const pair = await ensureKey()
  const timestamp = Date.now().toString()
  const nonce = crypto.randomUUID()
  const digest = base64url(
    new Uint8Array(await crypto.subtle.digest('SHA-256', Uint8Array.from(bodyBytes))),
  )
  const base = `${version}\n${method.toUpperCase()}\n${target}\n${timestamp}\n${nonce}\n${digest}`
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    pair.privateKey,
    new TextEncoder().encode(base),
  )
  return {
    'X-Request-Timestamp': timestamp,
    'X-Request-Nonce': nonce,
    'X-Request-Key': publicKeyHeader!,
    'X-Request-Signature': base64url(new Uint8Array(signature)),
  }
}

export function clearRequestProofKey(): void {
  keyPair = null
  publicKeyHeader = null
}
