import { create } from "zustand";
import { fetchDocumentsFromGoogleSheets, GoogleSheetDocument } from "./googleSheetsService";

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
  isLoadingGoogleSheets: boolean;
  googleSheetsError: string | null;
  lastGoogleSheetsSync: Date | null;
  addDocument: (document: Omit<Document, "id" | "createdAt">) => void;
  updateDocumentPosition: (documentId: string, position: string) => void;
  addExpedition: (expedition: Omit<ExpeditionRecord, "id">) => void;
  getDocumentsByIds: (ids: string[]) => Document[];
  loadGoogleSheetsData: () => Promise<void>;
  syncWithGoogleSheets: () => Promise<void>;
}

// Helper function to convert Google Sheets data to Document format
function convertGoogleSheetToDocument(sheetDoc: GoogleSheetDocument, index: number): Document {
  return {
    id: `gs-${Date.now()}-${index}`,
    agendaNo: sheetDoc.agendaNumber,
    sender: sheetDoc.sender,
    perihal: sheetDoc.perihal,
    position: "Pending",
    createdAt: new Date(),
    expeditionHistory: [],
    isFromGoogleSheets: true,
  };
}

// Sample local documents for demonstration (will be merged with Google Sheets data)
const initialLocalDocuments: Document[] = [
  {
    id: "local-1",
    agendaNo: "LOCAL-001",
    sender: "Local System",
    perihal: "System Test Document",
    position: "Pending",
    createdAt: new Date("2024-01-15"),
    expeditionHistory: [],
    isFromGoogleSheets: false,
  },
];

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: initialLocalDocuments,
  expeditions: [],
  isLoadingGoogleSheets: false,
  googleSheetsError: null,
  lastGoogleSheetsSync: null,

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
      const googleSheetsDocuments = await fetchDocumentsFromGoogleSheets();

      if (googleSheetsDocuments.length > 0) {
        const convertedDocuments = googleSheetsDocuments.map((doc, index) =>
          convertGoogleSheetToDocument(doc, index)
        );

        set((state) => ({
          documents: [
            ...state.documents.filter(doc => !doc.isFromGoogleSheets), // Keep local documents
            ...convertedDocuments, // Add Google Sheets documents
          ],
          isLoadingGoogleSheets: false,
          lastGoogleSheetsSync: new Date(),
        }));

        console.log(`Loaded ${convertedDocuments.length} documents from Google Sheets`);
      } else {
        set({
          isLoadingGoogleSheets: false,
          googleSheetsError: "No data found in Google Sheets or sheet is not publicly accessible"
        });
      }
    } catch (error) {
      console.error('Error loading Google Sheets data:', error);
      set({
        isLoadingGoogleSheets: false,
        googleSheetsError: error instanceof Error ? error.message : "Failed to load Google Sheets data"
      });
    }
  },

  syncWithGoogleSheets: async () => {
    const { loadGoogleSheetsData } = get();
    await loadGoogleSheetsData();
  },
}));
