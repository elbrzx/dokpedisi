import { create } from "zustand";
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
            timestamp: expedition.date,
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
      const response = await fetch("/api/documents");
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const { documents, total } = await response.json();

      // The dates will be strings, so we need to convert them to Date objects
      const processedDocuments = documents.map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        tanggalTerima: doc.tanggalTerima ? new Date(doc.tanggalTerima) : null,
        expeditionHistory: (doc.expeditionHistory || []).map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp),
        })),
      }));

      set({
        documents: processedDocuments,
        isLoadingGoogleSheets: false,
        totalDocumentsCount: total,
        lastGoogleSheetsSync: new Date(),
      });
    } catch (error) {
      set({
        googleSheetsError:
          error instanceof Error
            ? error.message
            : "Failed to load documents from the server",
        isLoadingGoogleSheets: false,
      });
    }
  },

  refreshData: async () => {
    // This can be simplified to just call the load function again
    get().loadGoogleSheetsData();
  },
}));
