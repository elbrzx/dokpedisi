import { RequestHandler } from "express";
import { google } from "googleapis";
import { Document } from "../../shared/api";

const SPREADSHEET_ID = "19FgFYyhgnMmWIVIHK-1cOmgrQIik_j4mqUnLz5aArR4";
const SHEET_NAME = "SURATMASUK";

const GOOGLE_CLIENT_EMAIL = "dokpedisi-agent@docupr-467003.iam.gserviceaccount.com";
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "";

async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: GOOGLE_CLIENT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

function convertRowToDocument(row: string[], index: number): Document | null {
  try {
    const agendaNo = row[0]?.trim();
    const dateString = row[1]?.trim();
    const sender = row[2]?.trim();
    const perihal = row[3]?.trim();

    if (!agendaNo) {
      return null;
    }

    let createdAt = new Date(0);
    if (dateString) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const parsedDate = new Date(Date.UTC(year, month, day));
        if (!isNaN(parsedDate.getTime())) {
          createdAt = parsedDate;
        }
      }
    }

    const expeditionHistory: any[] = [];
    for (let i = 6; i < row.length; i += 3) {
      const details = row[i]?.trim();
      const recipient = row[i + 1]?.trim();
      const signature = row[i + 2]?.trim();

      if (details && recipient) {
        const notesMatch = details.match(/Catatan: (.*)/);
        const notes = notesMatch && notesMatch[1] !== "-" ? notesMatch[1] : null;
        const dateTimeString = details.split(". Catatan:")[0].replace("Diterima pada ", "");
        const [datePart] = dateTimeString.split(" jam ");

        const dateParts = datePart.split("-");
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        const timestamp = new Date(Date.UTC(year, month, day));

        expeditionHistory.push({
          timestamp: !isNaN(timestamp.getTime()) ? timestamp : new Date(0),
          recipient,
          signature: signature || undefined,
          notes,
          details,
        });
      } else {
        break;
      }
    }

    const lastHistoryEntry = expeditionHistory.at(-1) ?? null;

    const currentStatus = expeditionHistory.length > 0 ? "Signed" : "Unknown";
    const currentRecipient = lastHistoryEntry?.recipient;
    const tanggalTerima = lastHistoryEntry?.timestamp;
    const lastExpedition = lastHistoryEntry?.details;
    const signature = lastHistoryEntry?.signature;

    return {
      id: `${agendaNo}-${index}`,
      agendaNo,
      sender,
      perihal,
      createdAt,
      position: currentStatus,
      expeditionHistory,
      currentRecipient,
      lastExpedition,
      signature,
      isFromGoogleSheets: true,
      tanggalTerima,
      currentStatus,
    };
  } catch (error) {
    console.error(`Error converting row ${index}:`, error);
    return null;
  }
}


export const handleGetDocuments: RequestHandler = async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows) {
      return res.status(404).json({ message: "Sheet not found or empty" });
    }

    // process rows
    const totalRows = rows.length;
    if (totalRows === 0) {
      return res.json({ documents: [], total: 0 });
    }

    const documents: Document[] = [];
    for (let i = 1; i < totalRows; i++) { // Start from 1 to skip header
      const doc = convertRowToDocument(rows[i], i);
      if (doc) {
        documents.push(doc);
      }
    }

    documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ documents, total: documents.length });

  } catch (error: any) {
    console.error("Error fetching documents from Google Sheets:", error);
    res.status(500).json({ message: "Error fetching documents", error: error.message, details: error.stack });
  }
};
