import { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import { GOOGLE_SHEETS_CONFIG } from '../../config/google-sheets.config';

// Service account credentials
const SERVICE_ACCOUNT_CREDENTIALS = GOOGLE_SHEETS_CONFIG.SERVICE_ACCOUNT;

const SPREADSHEET_ID = GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID;
const SHEET_NAME = GOOGLE_SHEETS_CONFIG.SHEET_NAME;

interface Document {
  id: string;
  agendaNo: string;
  sender: string;
  subject: string;
  position: string;
  createdAt: string;
  expeditionHistory: any[];
}

export const handler: Handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Create JWT client
    const auth = new google.auth.JWT(
      SERVICE_ACCOUNT_CREDENTIALS.client_email,
      undefined,
      SERVICE_ACCOUNT_CREDENTIALS.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    // Create Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });

    // Read data from the spreadsheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:G`, // Read from A2 to G to get all data
    });

    const rows = response.data.values || [];
    
    // Transform the data according to specifications
    const documents: Document[] = rows.map((row, index) => {
      const agendaNo = row[0] || `AGENDA-${String(index + 1).padStart(3, '0')}`; // Column A
      const sender = `${row[3] || ''} ${row[4] || ''}`.trim() || 'Unknown Sender'; // Columns D and E
      const subject = `${row[4] || ''} ${row[5] || ''} ${row[6] || ''}`.trim() || 'No Subject'; // Columns E, F, G
      
      return {
        id: `gs-${index + 1}`,
        agendaNo: agendaNo,
        sender: sender,
        subject: subject,
        position: 'Pending', // Default position
        createdAt: new Date().toISOString(),
        expeditionHistory: [],
      };
    });

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        documents,
        count: documents.length,
      }),
    };

  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
    };
  }
};
