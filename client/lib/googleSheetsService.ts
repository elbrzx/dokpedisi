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
    // Use Google Sheets CSV export URL for the entire sheet
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

    console.log("Fetching from URL:", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    console.log("Raw CSV rows:", rows.length);

    // Filter out completely empty rows and header row
    return rows.filter((row, index) => {
      if (index === 0) return false; // Skip header row
      return row.some((cell) => cell && cell.trim() !== "");
    });
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    return [];
  }
}

import { Document } from "./documentStore"; // Import the main Document type


// This function now transforms a raw sheet row into a rich Document object
function convertRowToDocument(row: string[], index: number): Document | null {
  try {
    // New Mapping:
    // No Agenda = row[0]
    // Sender=row[2]
    // Subject=[3]
    // Tanggal = row[4]
    // Status = row[5]
    // History starts at row[6]

    const agendaNo = row[0]?.trim();
    const sender = row[2]?.trim();
    const perihal = row[3]?.trim();
    const dateString = row[4]?.trim();
    const status = row[5]?.trim() || "Pending";

    // Only create document if we have the required fields
    if (!agendaNo || !sender || !perihal) {
      return null;
    }

    // Use the robust date parsing logic from the previous implementation
    const monthMap: { [key: string]: number } = {
        jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
        jul: 6, agu: 7, sep: 8, okt: 9, nov: 10, des: 11,
    };
    let createdAt = new Date();
    if (dateString) {
      const parts = dateString.replace(/\s+/g, "").split(/[\/\-]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const year = parseInt(parts[2], 10);
        let month = -1;
        const monthStr = parts[1].toLowerCase().substring(0, 3);
        if (monthMap[monthStr] !== undefined) month = monthMap[monthStr];
        else month = parseInt(parts[1], 10) - 1;
        if (!isNaN(day) && !isNaN(year) && month > -1) {
          createdAt = new Date(Date.UTC(year, month, day));
        }
      }
    }

    // Parse the wide expedition history
    const expeditionHistory: any[] = [];
    for (let i = 6; i < row.length; i += 3) {
      const details = row[i]?.trim();
      const recipient = row[i + 1]?.trim();
      const signature = row[i + 2]?.trim();

      if (details && recipient) {
        const notesMatch = details.match(/Catatan: (.*)/);
        const notes =
          notesMatch && notesMatch[1] !== "-" ? notesMatch[1] : null;
        const dateTimeString = details
          .split(". Catatan:")[0]
          .replace("Diterima pada ", "");
        const [datePart] = dateTimeString.split(" jam ");

        const dateParts = datePart.split("-");
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        const timestamp = new Date(Date.UTC(year, month, day));

        expeditionHistory.push({
          timestamp: timestamp, // Now a proper Date object
          recipient,
          signature: signature || undefined,
          notes: notes,
          details: details,
        });
      } else {
        break;
      }
    }

    const lastHistoryEntry = expeditionHistory.length > 0 ? expeditionHistory[expeditionHistory.length - 1] : null;
    const currentRecipient = lastHistoryEntry?.recipient;
    const lastExpedition = lastHistoryEntry?.details;
    const signature = lastHistoryEntry?.signature;


    return {
      id: `${agendaNo}-${index}`,
      agendaNo,
      sender,
      perihal,
      createdAt,
      position: status,
      expeditionHistory,
      currentRecipient,
      lastExpedition,
      signature,
      isFromGoogleSheets: true,
    };
  } catch (error) {
    console.error(`Error converting row ${index}:`, error);
    return null;
  }
}


// This function now returns fully processed Document objects
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

    console.log(`Successfully processed ${documents.length} documents from ${totalRows} rows`);
    // Sort by creation date, newest first
    documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { documents, total: totalRows };
  } catch (error) {
    console.error("Error fetching documents from Google Sheets:", error);
    return { documents: [], total: 0 };
  }
}

// Convert signature canvas data to low-resolution JPEG
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
        resolve(signatureDataUrl); // Fallback to original on error
      };
      img.src = signatureDataUrl;
    } catch (error) {
      console.error("Error converting signature:", error);
      resolve(signatureDataUrl); // Fallback to original on error
    }
  });
}

// Update spreadsheet with expedition data by calling the backend endpoint
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

// Get sheet statistics
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
