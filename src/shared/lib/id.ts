export function makeId(prefix = ''): string {
  const uuid = (globalThis.crypto && 'randomUUID' in globalThis.crypto)
    ? (globalThis.crypto as Crypto).randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return prefix ? `${prefix}${uuid}` : uuid;
}
