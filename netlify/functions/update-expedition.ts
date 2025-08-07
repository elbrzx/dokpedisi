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
    console.log('Received request body:', event.body);
    
    const body: UpdateExpeditionRequest = JSON.parse(event.body || '{}');
    const { agendaNo, expeditionData, currentLocation, status, signature } = body;

    console.log('Parsed request data:', {
      agendaNo,
      expeditionData,
      currentLocation,
      status,
      signatureLength: signature ? signature.length : 0
    });

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

    console.log('Created JWT client with email:', SERVICE_ACCOUNT_CREDENTIALS.client_email);

    // Create Google Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('Created Google Sheets API client');

    // First, find the row with the matching agenda number
    console.log('Searching for agenda number:', agendaNo, 'in spreadsheet:', SPREADSHEET_ID);
    
    const searchResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`, // Search in column A for agenda numbers
    });

    console.log('Search response:', searchResponse.data);

    const rows = searchResponse.data.values || [];
    console.log('Total rows found:', rows.length);
    console.log('First few rows:', rows.slice(0, 5));

    let targetRow = -1;

    for (let i = 0; i < rows.length; i++) {
      console.log(`Row ${i + 1}:`, rows[i][0], 'comparing with:', agendaNo);
      if (rows[i][0] === agendaNo) {
        targetRow = i + 1; // Google Sheets is 1-indexed
        console.log('Found matching row:', targetRow);
        break;
      }
    }

    if (targetRow === -1) {
      console.log('Available agenda numbers:', rows.map(row => row[0]).slice(0, 10));
      throw new Error(`Agenda number ${agendaNo} not found in spreadsheet`);
    }

    // Get existing expedition history
    const existingDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!F${targetRow}:I${targetRow}`,
    });

    const existingData = existingDataResponse.data.values?.[0] || [];
    let existingExpeditions: any[] = [];

    // Parse existing expedition history
    if (existingData[0]) {
      try {
        existingExpeditions = JSON.parse(existingData[0]);
        if (!Array.isArray(existingExpeditions)) {
          existingExpeditions = [];
        }
      } catch (e) {
        console.log('Failed to parse existing expeditions, starting fresh');
        existingExpeditions = [];
      }
    }

    console.log('Existing expeditions:', existingExpeditions);

    // Add new expedition
    expeditionData.order = existingExpeditions.length + 1;
    existingExpeditions.push(expeditionData);

    console.log('Updated expeditions:', existingExpeditions);

    // Prepare update data
    const updateData = [
      JSON.stringify(existingExpeditions), // Column F - Last Expedition
      currentLocation, // Column G - Current Location
      status, // Column H - Status
      signature, // Column I - Signature
    ];

    console.log('Updating row', targetRow, 'with data:', updateData);

    // Update the row
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!F${targetRow}:I${targetRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updateData],
      },
    });

    console.log('Update response:', updateResponse.data);

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
