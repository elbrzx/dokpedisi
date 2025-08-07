import { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import { GOOGLE_SHEETS_CONFIG } from '../../config/google-sheets.config';

// Service account credentials
const SERVICE_ACCOUNT_CREDENTIALS = GOOGLE_SHEETS_CONFIG.SERVICE_ACCOUNT;

const SPREADSHEET_ID = GOOGLE_SHEETS_CONFIG.SPREADSHEET_ID;
const SHEET_NAME = GOOGLE_SHEETS_CONFIG.SHEET_NAME;

interface UpdateExpeditionRequest {
  agendaNo: string;
  expeditionData: {
    id: string;
    date: string;
    time: string;
    recipient: string;
    notes: string;
    order: number;
  };
  currentLocation: string;
  status: string;
  signature: string;
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed',
      }),
    };
  }

  try {
    const body: UpdateExpeditionRequest = JSON.parse(event.body || '{}');
    const { agendaNo, expeditionData, currentLocation, status, signature } = body;

    if (!agendaNo) {
      throw new Error('Agenda number is required');
    }

    // Create JWT client
    const auth = new google.auth.JWT(
      SERVICE_ACCOUNT_CREDENTIALS.client_email,
      undefined,
      SERVICE_ACCOUNT_CREDENTIALS.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    // Create Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });

    // First, find the row with the matching agenda number
    const searchResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`, // Search in column A for agenda numbers
    });

    const rows = searchResponse.data.values || [];
    let targetRow = -1;

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === agendaNo) {
        targetRow = i + 1; // Google Sheets is 1-indexed
        break;
      }
    }

    if (targetRow === -1) {
      throw new Error(`Agenda number ${agendaNo} not found`);
    }

    // Get existing expedition history
    const existingDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!H${targetRow}:K${targetRow}`,
    });

    const existingData = existingDataResponse.data.values?.[0] || [];
    let existingExpeditions = [];

    // Parse existing expedition history
    if (existingData[0]) {
      try {
        existingExpeditions = JSON.parse(existingData[0]);
      } catch (e) {
        // If parsing fails, start with empty array
        existingExpeditions = [];
      }
    }

    // Add new expedition
    expeditionData.order = existingExpeditions.length + 1;
    existingExpeditions.push(expeditionData);

    // Prepare update data
    const updateData = [
      JSON.stringify(existingExpeditions), // Column H - Last Expedition
      currentLocation, // Column I - Current Location
      status, // Column J - Status
      signature, // Column K - Signature
    ];

    // Update the row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!H${targetRow}:K${targetRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updateData],
      },
    });

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Expedition data updated successfully',
        row: targetRow,
      }),
    };

  } catch (error) {
    console.error('Error updating expedition data:', error);
    
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
