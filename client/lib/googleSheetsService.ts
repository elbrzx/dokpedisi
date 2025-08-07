// Enhanced Google Sheets integration service
export interface GoogleSheetDocument {
  agendaNumber: string; // row [0]
  sender: string; // row [3]
  perihal: string; // row [4] - subject
  lastExpedition?: string; // row [5]
  currentLocation?: string; // row [6]
  status?: string; // row [7]
  signature?: string; // row [8]
}

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

// Convert row data to document format based on updated mapping
function convertRowToDocument(
  row: string[],
  index: number,
): GoogleSheetDocument | null {
  try {
    // Updated mapping based on requirements:
    // agendaNo = row [0]
    // sender = row [3]  
    // subject = row [4]
    // lastExpedition = row [5]
    // currentLocation = row [6]
    // status = row [7]
    // signature = row [8]
    
    const agendaNumber = row[0]?.trim();
    const sender = row[3]?.trim();
    const perihal = row[4]?.trim(); // subject
    const lastExpedition = row[5]?.trim() || undefined;
    const currentLocation = row[6]?.trim() || undefined;
    const status = row[7]?.trim() || "Pending";
    const signature = row[8]?.trim() || undefined;

    // Only create document if we have the required fields
    if (!agendaNumber || !sender || !perihal) {
      console.log(`Skipping row ${index}: missing required fields`, {
        agendaNumber: !!agendaNumber,
        sender: !!sender,
        perihal: !!perihal
      });
      return null;
    }

    return {
      agendaNumber,
      sender,
      perihal,
      lastExpedition,
      currentLocation,
      status,
      signature,
    };
  } catch (error) {
    console.error(`Error converting row ${index}:`, error);
    return null;
  }
}

// Fetch all document data from Google Sheets
export async function fetchDocumentsFromGoogleSheets(): Promise<{
  documents: GoogleSheetDocument[];
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

    // Get the most recent 500 rows
    const recentRows = rows.slice(-500);
    console.log(
      `Processing most recent ${recentRows.length} rows out of ${totalRows} total`,
    );

    const documents: GoogleSheetDocument[] = [];

    for (let i = 0; i < recentRows.length; i++) {
      const doc = convertRowToDocument(recentRows[i], i);
      if (doc) {
        documents.push(doc);
      }
    }

    console.log(
      `Successfully processed ${documents.length} documents from ${totalRows} rows`,
    );
    return { documents: documents.reverse(), total: totalRows }; // Reverse to show newest first
  } catch (error) {
    console.error("Error fetching documents from Google Sheets:", error);
    return { documents: [], total: 0 };
  }
}

// Convert signature canvas data to low-resolution JPEG
export function convertSignatureToLowResJPEG(signatureDataUrl: string): string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set low resolution for smaller file size
    canvas.width = 200;
    canvas.height = 100;

    const img = new Image();
    img.onload = () => {
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    img.src = signatureDataUrl;

    // Convert to JPEG with low quality for smaller size
    return canvas.toDataURL("image/jpeg", 0.3);
  } catch (error) {
    console.error("Error converting signature to low-res JPEG:", error);
    return signatureDataUrl;
  }
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
        status,
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
