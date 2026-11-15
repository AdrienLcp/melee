import type { Room } from '@/domain/room/room'

/** What every log line about a room carries, so Workers Logs can filter on a game or a phase. */
export const roomLogFields = (
  room: Room
): { code: string; game: string | null; phase: string } => ({
  code: room.code,
  game: room.settings.game?.kind ?? null,
  phase: room.phase
})
