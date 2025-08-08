import { create } from "zustand";
import {
  fetchDocumentsFromGoogleSheets
} from "./googleSheetsService";
import { Document, ExpeditionRecord } from "./types";


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
    const newExpeditionRecord: ExpeditionRecord = {
      ...expedition,
      id: Date.now().toString(),
      submittedAt: new Date(),
    };

    set((state) => ({
      expeditions: [...state.expeditions, newExpeditionRecord],
      documents: state.documents.map((doc) => {
        if (expedition.documentIds.includes(doc.id)) {
          // Create a new history entry that matches the Document['expeditionHistory'] type
          const newHistoryEntry = {
            timestamp: expedition.date, // This is already a Date object
            recipient: expedition.recipient,
            signature: expedition.signature,
            notes: expedition.notes,
            details: `Diterima pada ${
              expedition.date.toISOString().split("T")[0]
            } jam ${expedition.time}. Catatan: ${expedition.notes || "-"}`,
          };

          const newHistory = [...doc.expeditionHistory, newHistoryEntry];

          return {
            ...doc,
            position: "Signed",
            currentStatus: "Signed",
            expeditionHistory: newHistory,
            currentRecipient: newHistoryEntry.recipient,
            tanggalTerima: newHistoryEntry.timestamp,
            lastExpedition: newHistoryEntry.details,
            signature: newHistoryEntry.signature,
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
