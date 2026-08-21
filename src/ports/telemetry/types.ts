export type BranchTelemetryKind =
  | 'option'
  | 'claim'
  | 'counterargument'
  | 'risk'
  | 'unknown'

export type PerspectiveOutcome = 'success' | 'partial_failure' | 'failure' | 'cancelled'

export type EvidenceTelemetryKind =
  | 'user_fact'
  | 'external_source'
  | 'model_opinion'
  | 'inference'

export type DecisionTargetStatus = 'in_review' | 'decided'

export type DecisionExportFormat = 'markdown' | 'adr'

export type WorkflowErrorCode =
  | 'branch_creation_failed'
  | 'stream_parse_failed'
  | 'model_call_failed'
  | 'storage_failed'
  | 'export_failed'

export type TelemetryEvent =
  | { name: 'decision_created' }
  | { name: 'branch_confirmed'; branchKind: BranchTelemetryKind }
  | { name: 'perspective_completed'; outcome: PerspectiveOutcome }
  | { name: 'evidence_added'; evidenceKind: EvidenceTelemetryKind }
  | { name: 'draft_built' }
  | { name: 'status_changed'; targetStatus: DecisionTargetStatus; actor: 'user' }
  | { name: 'decision_exported'; format: DecisionExportFormat }
  | { name: 'workflow_blocked'; errorCode: WorkflowErrorCode }

export type TelemetryEventName = TelemetryEvent['name']

export interface Telemetry {
  track: (event: TelemetryEvent) => void
}
