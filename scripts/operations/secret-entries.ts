/**
 * The Bitwarden entries the operations scripts read, by name, in the personal
 * account. Each secret lives there only: never in a file of this repository.
 * docs/operations/secrets.md says what each one must hold.
 */
export const SECRET_ENTRIES = {
  cloudflareToken: 'Cloudflare Pages token',
  githubToken: 'Github PAT'
} as const
