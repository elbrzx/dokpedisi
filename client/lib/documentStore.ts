import { create } from "zustand";

export interface Document {
  id: string;
  agendaNo: string;
  sender: string;
  subject: string;
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
    expeditionHistory: [],
  },
  {
    id: "2",
    agendaNo: "DOC-002",
    sender: "HR Department",
    subject: "New Employee Onboarding",
    position: "In Review",
    createdAt: new Date("2024-01-16"),
    expeditionHistory: [
      {
        id: "exp-1",
        date: new Date("2024-01-16"),
        time: "09:30",
        recipient: "John Smith",
        order: 1,
        notes: "Initial review by HR Manager",
      },
    ],
    currentRecipient: "John Smith",
  },
  {
    id: "3",
    agendaNo: "DOC-003",
    sender: "Legal Department",
    subject: "Contract Amendment",
    position: "Pending",
    createdAt: new Date("2024-01-17"),
    expeditionHistory: [],
  },
  {
    id: "4",
    agendaNo: "DOC-004",
    sender: "Operations",
    subject: "Equipment Purchase Order",
    position: "Approved",
    createdAt: new Date("2024-01-18"),
    expeditionHistory: [
      {
        id: "exp-2",
        date: new Date("2024-01-18"),
        time: "14:15",
        recipient: "Operations Manager",
        order: 1,
      },
      {
        id: "exp-3",
        date: new Date("2024-01-19"),
        time: "10:30",
        recipient: "Finance Director",
        order: 2,
        notes: "Final approval granted",
      },
    ],
    currentRecipient: "Finance Director",
  },
  {
    id: "5",
    agendaNo: "DOC-005",
    sender: "IT Department",
    subject: "System Upgrade Proposal",
    position: "Pending",
    createdAt: new Date("2024-01-19"),
    expeditionHistory: [],
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
}));
