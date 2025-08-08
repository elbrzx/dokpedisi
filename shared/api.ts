/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

export interface ExpeditionHistoryEntry {
  timestamp: Date | string;
  recipient: string;
  signature?: string;
  notes?: string;
  details?: string;
  order?: number;
}

export interface Document {
  id: string;
  agendaNo: string;
  sender: string;
  perihal: string;
  position: string;
  createdAt: Date | string;
  expeditionHistory: ExpeditionHistoryEntry[];
  currentRecipient?: string;
  lastExpedition?: string;
  signature?: string;
  isFromGoogleSheets?: boolean;
  tanggalTerima?: Date | string;
  currentStatus?: string;
}

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}
