/**
 * Build a map: filename -> URL
 * Vite will replace these with final asset URLs at build time.
 */
const modules = import.meta.glob<string>('../../assets/avatars/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function getAvatarUrl(fileName: string): string | null {
  const key = Object.keys(modules).find((k) => k.endsWith('/' + fileName));
  return key ? (modules as Record<string, string>)[key] : null;
}

export function listAvatarFiles(): string[] {
  return Object.keys(modules)
    .map((k) => k.split('/').pop()!)
    .filter(Boolean);
}
