import type {
  Telemetry,
  TelemetryEvent,
  TelemetryEventName,
} from '../../../ports/telemetry'

export type TelemetryCountSnapshot = Readonly<Record<TelemetryEventName, number>>

function emptyCounts(): Record<TelemetryEventName, number> {
  return {
    decision_created: 0,
    branch_confirmed: 0,
    perspective_completed: 0,
    evidence_added: 0,
    draft_built: 0,
    status_changed: 0,
    decision_exported: 0,
    workflow_blocked: 0,
  }
}

/** Page-lifetime aggregate counter; it never retains event payloads. */
export class InMemoryTelemetry implements Telemetry {
  private counts = emptyCounts()

  track(event: TelemetryEvent): void {
    this.counts[event.name] += 1
  }

  snapshot(): TelemetryCountSnapshot {
    return { ...this.counts }
  }

  clear(): void {
    this.counts = emptyCounts()
  }
}
