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
    sender: string;       // E2:E  
    perihal: string;      // G2:G
  };
}

// Configuration for the provided Google Sheet
const SHEET_CONFIG: GoogleSheetsConfig = {
  spreadsheetId: '1J8wbXqWe6S6SDHNbEuRmuno94pehMY5NjdNz4aXcktM',
  sheetName: 'SURAT MASUK',
  ranges: {
    agendaNumber: 'A2:A',
    sender: 'E2:E',
    perihal: 'G2:G'
  }
};

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

// Fetch all document data from Google Sheets
export async function fetchDocumentsFromGoogleSheets(): Promise<GoogleSheetDocument[]> {
  try {
    console.log('Fetching documents from Google Sheets...');
    
    // Fetch all three ranges concurrently
    const [agendaNumbers, senders, perihals] = await Promise.all([
      fetchSheetRange(SHEET_CONFIG.spreadsheetId, SHEET_CONFIG.sheetName, SHEET_CONFIG.ranges.agendaNumber),
      fetchSheetRange(SHEET_CONFIG.spreadsheetId, SHEET_CONFIG.sheetName, SHEET_CONFIG.ranges.sender),
      fetchSheetRange(SHEET_CONFIG.spreadsheetId, SHEET_CONFIG.sheetName, SHEET_CONFIG.ranges.perihal)
    ]);

    console.log('Fetched data:', { agendaNumbers, senders, perihals });

    // Combine the data, using the shortest array length to avoid mismatched data
    const maxLength = Math.min(agendaNumbers.length, senders.length, perihals.length);
    const documents: GoogleSheetDocument[] = [];

    for (let i = 0; i < maxLength; i++) {
      const agendaNumber = agendaNumbers[i]?.trim();
      const sender = senders[i]?.trim();
      const perihal = perihals[i]?.trim();

      // Only add if all required fields have data
      if (agendaNumber && sender && perihal) {
        documents.push({
          agendaNumber,
          sender,
          perihal
        });
      }
    }

    console.log('Processed documents:', documents);
    return documents;
  } catch (error) {
    console.error('Error fetching documents from Google Sheets:', error);
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
