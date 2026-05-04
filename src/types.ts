export enum IncidentStatus {
  NEW = 'new',
  TRIAGED = 'triaged',
  CONTAINED = 'contained',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved'
}

export interface AuditEntry {
  action: string;
  timestamp: string;
  actor: string;
}

export interface Incident {
  id: string;
  createdAt: any;
  source: string;
  rawAlert: any;
  status: IncidentStatus;
  aiStatus?: 'pending' | 'completed' | 'failed' | 'quota_exceeded';
  aiError?: string;
  aiSummary?: string;
  severity?: number;
  confidence?: number;
  attackType?: string;
  mitreTechniques?: string[];
  iocs?: string[];
  recommendedActions?: string[];
  auditTrail: AuditEntry[];
  jiraTicketId?: string;
  slackNotified?: boolean;
  isPriority?: boolean;
}

export interface IntegrationConfig {
  userId: string;
  slackWebhook?: string;
  jiraConfig?: {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey: string;
  };
  wazuhSecretToken: string;
}

export interface PrioritizationRule {
  id: string;
  field: 'severity' | 'source' | 'mitre';
  operator: 'equals' | 'greater_than' | 'contains';
  value: string;
}

export interface UserSettings {
  userId: string;
  autopilotMode: 'recommend' | 'autopilot';
  orgName: string;
  minSeverity: number;
  prioritizationRules?: PrioritizationRule[];
}

export enum NotificationType {
  INCIDENT_NEW = 'incident_new',
  TRIAGE_COMPLETE = 'triage_complete',
  ACTION_EXECUTED = 'action_executed',
  SYSTEM_STATUS = 'system_status'
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: number;
  incidentId?: string;
  createdAt: any;
  read: boolean;
}
