import { create } from "zustand";

export interface Document {
  id: string;
  agendaNo: string;
  sender: string;
  subject: string;
  position: string;
  createdAt: Date;
  expeditionData?: {
    date: Date;
    time: string;
    recipient: string;
    signature?: string;
    notes?: string;
  };
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
  addDocument: (document: Omit<Document, "id" | "createdAt">) => void;
  updateDocumentPosition: (documentId: string, position: string) => void;
  addExpedition: (expedition: Omit<ExpeditionRecord, "id">) => void;
  getDocumentsByIds: (ids: string[]) => Document[];
}

// Sample documents for demonstration
const initialDocuments: Document[] = [
  {
    id: "1",
    agendaNo: "DOC-001",
    sender: "Finance Department",
    subject: "Budget Approval Request",
    position: "Pending",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    agendaNo: "DOC-002",
    sender: "HR Department",
    subject: "New Employee Onboarding",
    position: "In Review",
    createdAt: new Date("2024-01-16"),
  },
  {
    id: "3",
    agendaNo: "DOC-003",
    sender: "Legal Department",
    subject: "Contract Amendment",
    position: "Pending",
    createdAt: new Date("2024-01-17"),
  },
  {
    id: "4",
    agendaNo: "DOC-004",
    sender: "Operations",
    subject: "Equipment Purchase Order",
    position: "Approved",
    createdAt: new Date("2024-01-18"),
  },
  {
    id: "5",
    agendaNo: "DOC-005",
    sender: "IT Department",
    subject: "System Upgrade Proposal",
    position: "Pending",
    createdAt: new Date("2024-01-19"),
  },
];

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: initialDocuments,
  expeditions: [],

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
      documents: state.documents.map((doc) =>
        expedition.documentIds.includes(doc.id)
          ? {
              ...doc,
              position: "Accepted",
              expeditionData: {
                date: expedition.date,
                time: expedition.time,
                recipient: expedition.recipient,
                signature: expedition.signature,
                notes: expedition.notes,
              },
            }
          : doc,
      ),
    }));
  },

  getDocumentsByIds: (ids) => {
    const { documents } = get();
    return documents.filter((doc) => ids.includes(doc.id));
  },
}));
