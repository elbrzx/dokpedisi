// This file will contain shared type definitions to avoid circular dependencies.
export interface Document {
  id: string;
  agendaNo: string;
  sender: string;
  perihal: string; // Changed from subject to perihal
  position: string;
  createdAt: Date | string;
  expeditionHistory: Array<{
    timestamp: Date | string;
    recipient: string;
    signature?: string;
    notes?: string;
    details?: string;
  }>;
  currentRecipient?: string;
  lastExpedition?: string;
  signature?: string;
  // New fields for the redesigned UI
  tanggalTerima?: Date | string;
  currentStatus?: string;
}

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
