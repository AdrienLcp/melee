import { env } from '@/env'
import { nowMs } from '@/infrastructure/clock'
import {
  type ReportStore,
  type ServerReport,
  storedServerReport
} from '@/infrastructure/reports/report-store'

let store: ReportStore | null = null

/**
 * Set once by each runtime as it starts — the Worker's entry module, which
 * every isolate evaluates, Durable Objects included — so a fault deep in the
 * room engine reaches the database without a port threaded through it.
 */
export const keepServerReportsIn = (next: ReportStore | null): void => {
  store = next
}

/** Resolves once the row is written, or at once where no store is set. */
export const recordServerReport = async (
  report: ServerReport
): Promise<void> => {
  await store?.record(
    storedServerReport({ receivedAt: nowMs(), report, serverBuild: env.build })
  )
}
