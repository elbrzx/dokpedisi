// This file will contain shared type definitions to avoid circular dependencies.
export type { Document, ExpeditionHistoryEntry } from '../../shared/api';

export interface ExpeditionRecord {
  id: string;
  documentIds: string[];
  recipient: string;
  date: Date;
  time: string;
  signature?: string;
  notes?: string;
  submittedAt?: Date;
}
