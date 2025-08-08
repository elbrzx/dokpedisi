// Enhanced Google Sheets integration service

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
}

// Configuration for the provided Google Sheet
const SHEET_CONFIG: GoogleSheetsConfig = {
  spreadsheetId: "19FgFYyhgnMmWIVIHK-1cOmgrQIik_j4mqUnLz5aArR4",
  sheetName: "SURATMASUK",
};

import { Document } from "./types"; // Import the main Document type

// Parse CSV data with better handling
function parseCSV(csvText: string): string[][] {
  const lines = csvText.split("\n");
  return lines.map((line) => {
    const cells = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        cells.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current.trim().replace(/^"|"$/g, ""));
    return cells;
  });
}

// Fetch all sheet data at once
async function fetchEntireSheet(
  spreadsheetId: string,
  sheetName: string,
): Promise<string[][]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    console.log("Fetching from URL:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    console.log("Raw CSV rows:", rows.length);

    return rows.filter((row, index) => {
      if (index === 0) return false; // Skip header row
      return row.some((cell) => cell && cell.trim() !== "");
    });
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    return [];
  }
}

// Transform raw sheet row into Document object
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

// Fetch documents from Google Sheets
export async function fetchDocumentsFromGoogleSheets(): Promise<{
  documents: Document[];
  total: number;
}> {
  try {
    console.log("Fetching documents from Google Sheets...");
    const rows = await fetchEntireSheet(
      SHEET_CONFIG.spreadsheetId,
      SHEET_CONFIG.sheetName,
    );
    const totalRows = rows.length;

    if (totalRows === 0) {
      console.warn("No data rows found in sheet");
      return { documents: [], total: 0 };
    }

    console.log(`Processing ${totalRows} rows from sheet`);
    const documents: Document[] = [];
    for (let i = 0; i < totalRows; i++) {
      const doc = convertRowToDocument(rows[i], i);
      if (doc) {
        documents.push(doc);
      }
    }

    documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    console.log(`Successfully processed ${documents.length} documents from ${totalRows} rows`);

    return { documents, total: totalRows };
  } catch (error) {
    console.error("Error fetching documents from Google Sheets:", error);
    return { documents: [], total: 0 };
  }
}

// Convert signature canvas to JPEG
export function convertSignatureToLowResJPEG(
  signatureDataUrl: string,
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(signatureDataUrl);

      canvas.width = 200;
      canvas.height = 100;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.3));
      };
      img.onerror = () => {
        resolve(signatureDataUrl);
      };
      img.src = signatureDataUrl;
    } catch (error) {
      console.error("Error converting signature:", error);
      resolve(signatureDataUrl);
    }
  });
}

// Update sheet via backend API
export async function updateSpreadsheetWithExpedition(
  agendaNo: string,
  lastExpedition: string,
  currentLocation: string,
  status: string,
  signature?: string,
): Promise<boolean> {
  try {
    console.log(`Updating spreadsheet for agenda ${agendaNo} via backend`);

    const response = await fetch("/api/update-sheet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agendaNo,
        lastExpedition,
        currentLocation,
        signature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to update spreadsheet: ${errorData.message || response.statusText}`,
      );
    }

    const result = await response.json();
    console.log("Spreadsheet updated successfully:", result);
    return true;
  } catch (error) {
    console.error("Error updating spreadsheet:", error);
    return false;
  }
}

// Get sheet stats
export async function getSheetStats(): Promise<{
  totalRows: number;
  lastUpdate: Date;
}> {
  try {
    const rows = await fetchEntireSheet(
      SHEET_CONFIG.spreadsheetId,
      SHEET_CONFIG.sheetName,
    );
    return {
      totalRows: rows.length,
      lastUpdate: new Date(),
    };
  } catch (error) {
    console.error("Error getting sheet stats:", error);
    return {
      totalRows: 0,
      lastUpdate: new Date(),
    };
  }
}