import type { ProtocolErrorMessage } from '@melee/protocol/server-message'

/** What reached the root error boundary, kept for whoever opens the console next. */
export const reportUnrenderedError = (error: unknown): void => {
  console.error('The app hit an error it could not render through', error)
}

/**
 * An `invalid_message` answers a frame this app built, never something the
 * person pressed wrong — "try again" would resend the same frame. It is kept
 * off the screen and left here, with the server's reason, for the developer.
 */
export const isOurOwnMalformedFrame = (error: ProtocolErrorMessage): boolean =>
  error.code === 'invalid_message' && !error.fatal

export const reportRefusedFrame = (error: ProtocolErrorMessage): void => {
  console.error('The server refused a frame this app built', error.message)
}
