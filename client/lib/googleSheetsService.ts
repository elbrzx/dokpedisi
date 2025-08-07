// Enhanced Google Sheets integration service
export interface GoogleSheetDocument {
  agendaNumber: string; // row [0]
  createdAt: Date; // row [2]
  sender: string; // row [3]
  perihal: string; // row [4] - subject
  lastExpedition?: string; // row [5]
  currentLocation?: string; // row [6]
  signature?: string; // row [8]
  expeditionHistory?: string; // row [9]
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
    // Mapping based on requirements:
    // agendaNo = row [0]
    // createdAt = row [2] (TANGGAL TERIMA)
    // sender = row [3]
    // subject = row [4]
    // lastExpedition = row [5]
    // currentLocation = row [6]
    // signature = row [8]
    // expeditionHistory = row [9]

    const agendaNumber = row[0]?.trim();
    const dateString = row[2]?.trim();
    const sender = row[3]?.trim();
    const perihal = row[4]?.trim(); // subject
    const lastExpedition = row[5]?.trim() || undefined;
    const currentLocation = row[6]?.trim() || undefined;
    const signature = row[8]?.trim() || undefined;
    const expeditionHistory = row[9]?.trim() || undefined;

    // Robust date parsing for DD-MMM-YYYY (e.g., 01-Jan-2024) and other formats
    let createdAt = new Date(); // Fallback
    if (dateString) {
      const monthMap: { [key: string]: number } = {
        jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
        jul: 6, agu: 7, sep: 8, okt: 9, nov: 10, des: 11,
      };

      const parts = dateString.replace(/\s+/g, "").split(/[\/\-]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const year = parseInt(parts[2], 10);
        let month = -1;

        const monthStr = parts[1].toLowerCase().substring(0, 3);
        if (monthMap[monthStr] !== undefined) {
          // Handle MMM month format (e.g., Jan, Agu)
          month = monthMap[monthStr];
        } else {
          // Handle MM month format (e.g., 01, 12)
          month = parseInt(parts[1], 10) - 1;
        }

        if (!isNaN(day) && !isNaN(year) && month > -1 && year > 1900) {
          // Check for valid year to avoid mix-ups
           createdAt = new Date(Date.UTC(year, month, day));
        } else {
          // Fallback for other formats like MM/DD/YYYY that Date.parse understands
          const parsedDate = Date.parse(dateString);
          if (!isNaN(parsedDate)) {
            createdAt = new Date(parsedDate);
          }
        }
      }
    }

    // Only create document if we have the required fields
    if (!agendaNumber || !sender || !perihal) {
      console.log(`Skipping row ${index}: missing required fields`, {
        agendaNumber: !!agendaNumber,
        sender: !!sender,
        perihal: !!perihal,
      });
      return null;
    }

    return {
      agendaNumber,
      createdAt,
      sender,
      perihal,
      lastExpedition,
      currentLocation,
      signature,
      expeditionHistory,
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

    console.log(`Processing ${totalRows} rows from sheet`);

    const documents: GoogleSheetDocument[] = [];

    for (let i = 0; i < totalRows; i++) {
      const doc = convertRowToDocument(rows[i], i);
      if (doc) {
        documents.push(doc);
      }
    }

    console.log(
      `Successfully processed ${documents.length} documents from ${totalRows} rows`,
    );
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
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return reject(new Error("Could not get canvas context"));
      }

      // Set low resolution for smaller file size
      canvas.width = 200;
      canvas.height = 100;

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Convert to JPEG with low quality for smaller size
        const lowResDataUrl = canvas.toDataURL("image/jpeg", 0.3);
        resolve(lowResDataUrl);
      };
      img.onerror = (error) => {
        console.error("Error loading signature image for conversion:", error);
        // Fallback to original high-res image on error
        resolve(signatureDataUrl);
      };
      img.src = signatureDataUrl;
    } catch (error) {
      console.error("Error converting signature to low-res JPEG:", error);
      // Fallback to original high-res image on error
      resolve(signatureDataUrl);
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
