import { RequestHandler } from "express";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

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
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
}

function toColumnName(num: number): string {
  let str = "",
    q,
    r;
  while (num >= 0) {
    q = Math.floor(num / 26);
    r = num % 26;
    str = String.fromCharCode(65 + r) + str;
    num = q - 1;
  }
  return str;
}

export const handleUpdateSheet: RequestHandler = async (req, res) => {
  console.log("Received request to update sheet with body:", req.body);
  const { agendaNo, lastExpedition, currentLocation, signature } = req.body;
  const status = "Diterima";

  if (!agendaNo) {
    return res.status(400).json({ message: "agendaNo is required" });
  }

  try {
    let signatureUrl = "";
    if (signature) {
      console.log("Signature detected, attempting to upload to Supabase...");
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_KEY!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const base64Data = signature.replace(/^data:image\/jpeg;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `signatures/signature-${agendaNo}-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from("signatures")
        .upload(fileName, buffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) throw new Error(`Supabase upload failed: ${error.message}`);

      console.log("Supabase upload successful:", data);

      const { data: urlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(data.path);

      signatureUrl = urlData.publicUrl;
      console.log("Public URL:", signatureUrl);
    }

    const sheets = await getGoogleSheetsClient();
    const findResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`,
    });

    const rows = findResponse.data.values;
    if (!rows) return res.status(404).json({ message: "Sheet not found or empty" });

    const rowIndex = rows.findIndex((row, index) => index > 0 && row[0] === agendaNo);
    if (rowIndex === -1) return res.status(404).json({ message: `Agenda number ${agendaNo} not found` });

    const actualRowNumber = rowIndex + 1;
    const currentRow = rows[rowIndex];

    let targetColumnIndex = -1;
    for (let i = 6; i < 26; i += 3) {
      if (!currentRow[i]) {
        targetColumnIndex = i;
        break;
      }
    }

    if (targetColumnIndex === -1) {
      return res.status(500).json({ message: "No available history slots found" });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!F${actualRowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [[status]] },
    });

    const startColumn = toColumnName(targetColumnIndex);
    const endColumn = toColumnName(targetColumnIndex + 2);
    const historyUpdateRange = `${SHEET_NAME}!${startColumn}${actualRowNumber}:${endColumn}${actualRowNumber}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: historyUpdateRange,
      valueInputOption: "RAW",
      requestBody: {
        values: [[lastExpedition, currentLocation, signatureUrl]],
      },
    });

    res.json({ message: "Sheet and signature updated successfully", updatedRange: historyUpdateRange });
  } catch (error: any) {
    console.error("Full error object:", JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      res.status(500).json({ message: "Error processing expedition", error: error.message, details: error.stack });
    } else {
      res.status(500).json({ message: "An unknown error occurred", details: error });
    }
  }
};