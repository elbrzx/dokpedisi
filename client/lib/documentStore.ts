import { create } from "zustand";
import {
  fetchDocumentsFromGoogleSheets,
  GoogleSheetDocument,
} from "./googleSheetsService";

export interface Document {
  id: string;
  agendaNo: string;
  sender: string;
  perihal: string; // Changed from subject to perihal
  position: string;
  createdAt: Date;
  expeditionHistory: Array<{
    timestamp: Date;
    recipient: string;
    signature?: string;
    notes?: string;
    details?: string;
  }>;
  currentRecipient?: string;
  isFromGoogleSheets?: boolean;
  lastExpedition?: string;
  signature?: string;
  // New fields for the redesigned UI
  tanggalTerima?: Date;
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

interface DocumentStore {
  documents: Document[];
  expeditions: ExpeditionRecord[];
  isLoadingGoogleSheets: boolean;
  googleSheetsError: string | null;
  lastGoogleSheetsSync: Date | null;
  totalDocumentsCount: number;
  addDocument: (document: Omit<Document, "id" | "createdAt">) => void;
  updateDocumentPosition: (documentId: string, position: string) => void;
  addExpedition: (expedition: Omit<ExpeditionRecord, "id">) => void;
  getDocumentsByIds: (ids: string[]) => Document[];
  loadGoogleSheetsData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

// Empty initial documents - will be populated from Google Sheets
const initialLocalDocuments: Document[] = [];

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: initialLocalDocuments,
  expeditions: [],
  isLoadingGoogleSheets: false,
  googleSheetsError: null,
  lastGoogleSheetsSync: null,
  totalDocumentsCount: 0,

  addDocument: (document) => {
    const newDocument: Document = {
      ...document,
      id: Date.now().toString(),
      createdAt: new Date(),
      isFromGoogleSheets: false,
    };
    set((state) => ({
      documents: [...state.documents, newDocument],
    }));
  },

  updateDocumentPosition: (documentId, position) => {
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId ? { ...doc, position } : doc,
      ),
    }));
  },

  addExpedition: (expedition) => {
    const newExpedition: ExpeditionRecord = {
      ...expedition,
      id: Date.now().toString(),
      submittedAt: new Date(),
    };

    set((state) => ({
      expeditions: [...state.expeditions, newExpedition],
      documents: state.documents.map((doc) => {
        if (expedition.documentIds.includes(doc.id)) {
          const newExpeditionEntry = {
            id: `exp-${Date.now()}-${doc.id}`,
            date: expedition.date,
            time: expedition.time,
            recipient: expedition.recipient,
            signature: expedition.signature,
            notes: expedition.notes,
            order: doc.expeditionHistory.length + 1,
          };

          return {
            ...doc,
            position: "Accepted",
            expeditionHistory: [...doc.expeditionHistory, newExpeditionEntry],
            currentRecipient: expedition.recipient,
          };
        }
        return doc;
      }),
    }));
  },

  getDocumentsByIds: (ids) => {
    const { documents } = get();
    return documents.filter((doc) => ids.includes(doc.id));
  },

  loadGoogleSheetsData: async () => {
    set({ isLoadingGoogleSheets: true, googleSheetsError: null });
    try {
      const { documents, total } = await fetchDocumentsFromGoogleSheets();
      // The service now returns fully processed Document objects, so no mapping is needed.
      // The sorting is also already done in the service.
      set({
        documents,
        isLoadingGoogleSheets: false,
        totalDocumentsCount: total,
        lastGoogleSheetsSync: new Date(),
      });
    } catch (error) {
      set({
        googleSheetsError:
          error instanceof Error
            ? error.message
            : "Failed to load documents from Google Sheets",
        isLoadingGoogleSheets: false,
      });
    }
  },

  refreshData: async () => {
    // This can be simplified to just call the load function again
    get().loadGoogleSheetsData();
  },
}));
