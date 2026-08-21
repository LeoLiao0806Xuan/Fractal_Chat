import { describe, expect, it } from 'vitest'
import { InMemoryTelemetry } from './index'

describe('InMemoryTelemetry', () => {
  it('aggregates structural event names without retaining payload fields', () => {
    const telemetry = new InMemoryTelemetry()

    telemetry.track({ name: 'branch_confirmed', branchKind: 'option' })
    telemetry.track({ name: 'branch_confirmed', branchKind: 'risk' })
    telemetry.track({ name: 'workflow_blocked', errorCode: 'stream_parse_failed' })

    expect(telemetry.snapshot()).toMatchObject({
      branch_confirmed: 2,
      workflow_blocked: 1,
    })
    expect(JSON.stringify(telemetry.snapshot())).not.toContain('option')
    expect(JSON.stringify(telemetry.snapshot())).not.toContain('stream_parse_failed')
  })

  it('clears all page-lifetime counts', () => {
    const telemetry = new InMemoryTelemetry()
    telemetry.track({ name: 'decision_created' })

    telemetry.clear()

    expect(telemetry.snapshot().decision_created).toBe(0)
  })
})
