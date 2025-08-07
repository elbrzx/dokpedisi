import { create } from "zustand";
import { fetchDocumentsFromGoogleSheets, fetchDocumentsFromGoogleSheetsAPI, GoogleSheetDocument } from "./googleSheetsService";

export interface Document {
  id: string;
  agendaNo: string;
  sender: string;
  perihal: string; // Changed from subject to perihal
  position: string;
  createdAt: Date;
  expeditionHistory: Array<{
    id: string;
    date: Date;
    time: string;
    recipient: string;
    signature?: string;
    notes?: string;
    order: number;
  }>;
  currentRecipient?: string;
  isFromGoogleSheets?: boolean;
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
  isLoading: boolean;
  error: string | null;
  addDocument: (document: Omit<Document, "id" | "createdAt">) => void;
  updateDocumentPosition: (documentId: string, position: string) => void;
  addExpedition: (expedition: Omit<ExpeditionRecord, "id">) => void;
  getDocumentsByIds: (ids: string[]) => Document[];
  loadDocumentsFromGoogleSheets: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
}



// Empty initial documents - will be populated from Google Sheets
const initialLocalDocuments: Document[] = [];

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: initialLocalDocuments,
  expeditions: [],
  isLoading: false,
  error: null,

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

  loadDocumentsFromGoogleSheets: async () => {
    set({ isLoading: true, error: null });
    try {
      // Try API method first, fallback to CSV method
      let googleSheetsDocuments;
      try {
        googleSheetsDocuments = await fetchDocumentsFromGoogleSheetsAPI();
      } catch (apiError) {
        console.warn('API method failed, trying CSV method:', apiError);
        googleSheetsDocuments = await fetchDocumentsFromGoogleSheets();
      }
      
      // Replace all documents with Google Sheets data (no merging with dummy data)
      set({ documents: googleSheetsDocuments, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load documents from Google Sheets',
        isLoading: false 
      });
    }
  },

  refreshDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      // Try API method first, fallback to CSV method
      let googleSheetsDocuments;
      try {
        googleSheetsDocuments = await fetchDocumentsFromGoogleSheetsAPI();
      } catch (apiError) {
        console.warn('API method failed, trying CSV method:', apiError);
        googleSheetsDocuments = await fetchDocumentsFromGoogleSheets();
      }
      
      // Replace all documents with Google Sheets data (no merging)
      set({ documents: googleSheetsDocuments, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to refresh documents from Google Sheets',
        isLoading: false 
      });
    }
  },
}));
