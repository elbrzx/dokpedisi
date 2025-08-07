import { Document } from './documentStore';
import { GOOGLE_SHEETS_CONFIG, API_ENDPOINTS } from '../../config/google-sheets.config';

// Google Sheets integration service
export interface GoogleSheetDocument {
  agendaNumber: string;
  sender: string;
  perihal: string; // Subject renamed to Perihal
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  ranges: {
    agendaNumber: string; // A2:A
    sender: string;       // D2:E  
    perihal: string;      // E2:G
  };
}

// Configuration for the provided Google Sheet
const SHEET_CONFIG: GoogleSheetsConfig = {
  spreadsheetId: GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID,
  sheetName: GOOGLE_SHEETS_CONFIG.SHEET_NAME,
  ranges: {
    agendaNumber: 'A2:A',
    sender: 'D2:E',
    perihal: 'E2:G'
  }
};

// Service account credentials (for reference only - not used in client-side)
const SERVICE_ACCOUNT_CREDENTIALS = GOOGLE_SHEETS_CONFIG.SERVICE_ACCOUNT;

// Parse CSV data
function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n');
  return lines.map(line => {
    const cells = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

// Fetch data from a specific range in Google Sheets
async function fetchSheetRange(spreadsheetId: string, sheetName: string, range: string): Promise<string[]> {
  try {
    // Use Google Sheets CSV export URL for public sheets
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&range=${encodeURIComponent(range)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    // Extract values, filter out empty rows
    return rows
      .map(row => row[0] || '')
      .filter(value => value.trim() !== '');
  } catch (error) {
    console.error(`Error fetching range ${range}:`, error);
    return [];
  }
}

// Fetch all document data from Google Sheets using CSV export
export async function fetchDocumentsFromGoogleSheets(): Promise<Document[]> {
  try {
    console.log('Fetching documents from Google Sheets...');
    
    // Using public CSV export method for simplicity
    const csvUrl = API_ENDPOINTS.CSV_EXPORT(SHEET_CONFIG.spreadsheetId, SHEET_CONFIG.sheetName);
    
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    // Skip header row and map data according to specifications
    const documents: Document[] = rows.slice(1).map((row, index) => {
      const agendaNo = row[0] || `AGENDA-${String(index + 1).padStart(3, '0')}`; // Column A
      const sender = `${row[3] || ''} ${row[4] || ''}`.trim() || 'Unknown Sender'; // Columns D and E
      const perihal = `${row[4] || ''} ${row[5] || ''} ${row[6] || ''}`.trim() || 'No Perihal'; // Columns E, F, G
      
      return {
        id: `gs-${index + 1}`,
        agendaNo: agendaNo,
        sender: sender,
        perihal: perihal,
        position: 'Pending', // Default position
        createdAt: new Date(),
        expeditionHistory: [],
        isFromGoogleSheets: true,
      };
    });

    console.log('Processed documents:', documents);
    return documents;
  } catch (error) {
    console.error('Error fetching documents from Google Sheets:', error);
    return [];
  }
}

// Alternative method using Google Sheets API v4 (requires server-side implementation)
export async function fetchDocumentsFromGoogleSheetsAPI(): Promise<Document[]> {
  try {
    // Using Netlify Function endpoint
    const response = await fetch(API_ENDPOINTS.GOOGLE_SHEETS);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.success) {
      return data.documents.map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        isFromGoogleSheets: true,
      }));
    } else {
      throw new Error(data.error || 'Failed to fetch documents');
    }
  } catch (error) {
    console.error('Error fetching documents from Google Sheets API:', error);
    return [];
  }
}

// Alternative method using Google Sheets API (requires API key)
export async function fetchDocumentsWithAPI(apiKey: string): Promise<GoogleSheetDocument[]> {
  try {
    const { spreadsheetId, sheetName, ranges } = SHEET_CONFIG;
    
    // Construct ranges for batch request
    const rangeQueries = [
      `${sheetName}!${ranges.agendaNumber}`,
      `${sheetName}!${ranges.sender}`,
      `${sheetName}!${ranges.perihal}`
    ];
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${rangeQueries.join('&ranges=')}&key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const valueRanges = data.valueRanges;
    
    if (!valueRanges || valueRanges.length < 3) {
      throw new Error('Insufficient data from Google Sheets API');
    }
    
    const agendaNumbers = valueRanges[0].values?.flat() || [];
    const senders = valueRanges[1].values?.flat() || [];
    const perihals = valueRanges[2].values?.flat() || [];
    
    const maxLength = Math.min(agendaNumbers.length, senders.length, perihals.length);
    const documents: GoogleSheetDocument[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      const agendaNumber = agendaNumbers[i]?.trim();
      const sender = senders[i]?.trim();
      const perihal = perihals[i]?.trim();
      
      if (agendaNumber && sender && perihal) {
        documents.push({
          agendaNumber,
          sender,
          perihal
        });
      }
    }
    
    return documents;
  } catch (error) {
    console.error('Error fetching documents with Google Sheets API:', error);
    return [];
  }
}
