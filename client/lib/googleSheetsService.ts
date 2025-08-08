/* client/lib/googleSheetsService.ts ------------------------------------------------- */
/* 1️⃣  Types (pastikan tipe‑tipe ini juga diekspor dari "./types" bila
   dipakai di tempat lain) ------------------------------------------------------- */
export interface ExpeditionEntry {
  timestamp: Date;
  recipient: string;
  signature?: string;
  notes?: string | null;
  details: string;
}

export interface Document {
  id: string;
  agendaNo: string;
  sender: string;
  perihal: string;
  createdAt: Date;
  currentStatus: string;
  position: string;
  expeditionHistory: ExpeditionEntry[];
  currentRecipient?: string;
  lastExpedition?: string;
  signature?: string;
  isFromGoogleSheets: true;
  tanggalTerima?: Date;
}

/* ------------------------------------------------------------------------------ */
/* 2️⃣  Google‑Sheets service (tidak berubah dari versi sebelumnya) --------------- */
import { SHEET_CONFIG } from "./sheetConfig"; // <-- file terpisah berisi konfigurasi
// … fungsi fetchEntireSheet, parseCSV, parseDMY, buildExpeditionHistory,
//    convertRowToDocument, fetchDocumentsFromGoogleSheets, dll.
 // (kode lengkap ada di jawaban sebelumnya – cukup copy‑paste ke sini)

export async function fetchDocumentsFromGoogleSheets(): Promise<{
  documents: Document[];
  total: number;
}> {
  /* … implementasi sama seperti di jawaban sebelumnya … */
}

/* ------------------------------------------------------------------------------ */
/* 3️⃣  Zustand store ---------------------------------------------------------------- */
import { create } from "zustand";

interface DocumentStore {
  documents: Document[];
  expeditions: ExpeditionEntry[];          // memakai tipe yang sama
  isLoadingGoogleSheets: boolean;
  googleSheetsError: string | null;
  lastGoogleSheetsSync: Date | null;
  totalDocumentsCount: number;

  addDocument: (doc: Omit<Document, "id" | "createdAt">) => void;
  updateDocumentPosition: (docId: string, position: string) => void;
  addExpedition: (exp: Omit<ExpeditionEntry, "timestamp"> & {
    documentIds: string[];
    date: string;      // contoh format “YYYY‑MM‑DD”
    time: string;      // contoh “14:30”
    recipient: string;
    signature?: string;
    notes?: string;
  }) => void;
  getDocumentsByIds: (ids: string[]) => Document[];
  loadGoogleSheetsData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

/* Empty start – akan terisi lewat loadGoogleSheetsData() */
const initialLocalDocuments: Document[] = [];

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: initialLocalDocuments,
  expeditions: [],
  isLoadingGoogleSheets: false,
  googleSheetsError: null,
  lastGoogleSheetsSync: null,
  totalDocumentsCount: 0,

  /* --------------------------------------------------- */
  addDocument: (doc) => {
    const newDoc: Document = {
      ...doc,
      id: Date.now().toString(),
      createdAt: new Date(),
      currentStatus: "New",
      position: "New",
      expeditionHistory: [],
      isFromGoogleSheets: false,
    };
    set((s) => ({ documents: [...s.documents, newDoc] }));
  },

  /* --------------------------------------------------- */
  updateDocumentPosition: (docId, position) => {
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === docId ? { ...d, position, currentStatus: position } : d,
      ),
    }));
  },

  /* --------------------------------------------------- */
  addExpedition: (exp) => {
    const newExp: ExpeditionEntry = {
      timestamp: new Date(`${exp.date}T${exp.time}`),
      recipient: exp.recipient,
      signature: exp.signature,
      notes: exp.notes ?? null,
      details: `Diterima pada ${exp.date} jam ${exp.time}${
        exp.notes ? `. Catatan: ${exp.notes}` : ""
      }`,
    };

    // Simpan di list global (jika diperlukan)
    set((s) => ({
      expeditions: [...s.expeditions, newExp],
    }));

    // Update setiap dokumen yang ter‑select
    set((s) => ({
      documents: s.documents.map((doc) => {
        if (!exp.documentIds.includes(doc.id)) return doc;

        const order = doc.expeditionHistory.length + 1;
        return {
          ...doc,
          position: "Accepted",
          currentRecipient: exp.recipient,
          expeditionHistory: [
            ...doc.expeditionHistory,
            { ...newExp, order }, // tambahkan order untuk keperluan UI
          ],
        };
      }),
    }));
  },

  /* --------------------------------------------------- */
  getDocumentsByIds: (ids) => {
    const { documents } = get();
    return documents.filter((d) => ids.includes(d.id));
  },

  /* --------------------------------------------------- */
  loadGoogleSheetsData: async () => {
    set({ isLoadingGoogleSheets: true, googleSheetsError: null });
    try {
      const { documents, total } = await fetchDocumentsFromGoogleSheets();

      set({
        documents,
        totalDocumentsCount: total,
        isLoadingGoogleSheets: false,
        lastGoogleSheetsSync: new Date(),
      });
    } catch (e) {
      set({
        googleSheetsError:
          e instanceof Error ? e.message : "Failed to load Google Sheets",
        isLoadingGoogleSheets: false,
      });
    }
  },

  /* --------------------------------------------------- */
  refreshData: async () => {
    // cukup panggil ulang loadGoogleSheetsData()
    await get().loadGoogleSheetsData();
  },
}));
/* ------------------------------------------------------------------------------ */
