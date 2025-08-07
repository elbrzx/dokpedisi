import { RequestHandler } from "express";
import { google } from "googleapis";

// Configuration
const SPREADSHEET_ID = "19FgFYyhgnMmWIVIHK-1cOmgrQIik_j4mqUnLz5aArR4";
const SHEET_NAME = "SURATMASUK";

// TODO: Move these credentials to environment variables in a production environment
const GOOGLE_CLIENT_EMAIL = "dokpedisi-agent@docupr-467003.iam.gserviceaccount.com";
const GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDZJwLNrxOIZNcE\nRNlmCLfojgrQy/Hu6i+jpEMiyPZOkL4cRnCf/nSC6cAGD6YDvNWpItAE5nuiGl78\nhGgxZHKKTRZSs69yCvV+tBqNc31auUo0osg6b96e9Fw5z/35hPqlxSB2/xKoCwgN\nj8wUhZHNnkNI/cSFSYffheK18G5St/YH649o7Xxbe/4P5NqfWiCXtLTLWhD4mGZX\n3y4yn8x5LQ3CToDgrMl954Uwy/ltmf8dAkDdM2S0sqngR7AVIqwyleNy53uEzul3\nlKFHaY+7cIg11PIv+p0qKN+DICD8F5qhWCJwR+n/SadBfhSrLWrKh4fI2tcst+tn\nEKH4JMC1AgMBAAECggEAIbMCpd3eJ6QSlDiFDmca902X0xhbVsrkEr6qporOYpnm\nzueFkebAuRJCeQ5Toq/a7pEW/DOyixERnZmEu+mNNvZImRQGjamyuHOFzV7XXM11\nfR6n+R2kTEG60EP9c4wWA8TISX9DK23u1X/z2VlzK5g8c+bh6RdkrSUPblG+JTrb\nANYhyLrOB+DUWlCdcolE5RAqfRMgtOIjADCNglEn7npadV+04SvO+2V6lmTA9zPp\n27FydGxZjUvO/fNPM+lv+9GS9jzwWqmkJ6MhqP0mvLi/J4KklcLj1ifdM/4n6yz/\n/arnHQdQtXDQYYqVsmQQA1E3e+fFp7lXLf/DQP5cYQKBgQD3gSq+RfsOFrrthHDw\nkmB5borv2S+B7zew61Fq3dDOcjAvlpeC3g+Kp2gS8X/n40D0HE0YhSLEavGsJCwi\nQVJBNssOLc4MH0cvAWweanXI2hPM0lCww4Z+0TiFboQ/0RCpMVG15cYffTKKfGes\n1LUwR2Dur0yWQI6oe9s1dlZFcQKBgQDgmyNezSzVRo6xJMToTClAtQX82CY1rgyg\n4F0KM/tMnq9rNbdQJU64ny+Xmp71qjElSoA4N6zMmQH80nbetVQm8Lpwl19rmxgG\nWDkQ7Jz+pkYrYUGgPp49TnAFnFvY4OarfweTJGp22+luin2c1ejLgw6QnTr/4ZOy\n3sAlhNL9hQKBgF/st9w20y6KsLgNdJhIowttRHvg+QCq7jKrgUqh3aOlrfdDrkUS\nO4PJjhSJdMEy2qHBtj+ime72Y+QLwO8l0fNkgR5lsk4QcU5OhtDjAfNuUe44NP3N\nSfssq3NLegYhyQtKChktjLP3mfcCcEwTxIWJpI/dcRlqu9+g4Ty/OICBAoGAbSz7\n1GkHEeRqF9E3pXLf2oQjlPO8HvurR8fHcd4ymNvJiONjZ6G60iMOjzKpceB4YxgD\nm0/0vr7hKHNlNHwPm54IAhKSX0vUMcFQe9mHtoA8O3na3HmTkVk/Onr2akVn2pS0\nqeFZnszmesT2qfWQYtwhiEnlE9wiXx/HZnVZ2cECgYAyxI1ELgL/CGaWyJJZxWUi\nWPWXyd0rQj8tk3/cOLATsQdhj/Y2r61wpE+dVI/PEH/l4SQ5TLMN2IYMBr8j/bBn\n5vGiqQRAtR9UW+fdmfOKNdsYMDckthNlrn5+KNqj+M38LJF6qnl2C/cikPeFnL5A\nW70JTKJJCG3luggcN0qhDw==\n-----END PRIVATE KEY-----\n";

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

export const handleUpdateSheet: RequestHandler = async (req, res) => {
  console.log("Received request to update sheet with body:", req.body);
  const { agendaNo, lastExpedition, currentLocation, status, signature } =
    req.body;

  if (!agendaNo) {
    return res.status(400).json({ message: "agendaNo is required" });
  }

  try {
    const sheets = await getGoogleSheetsClient();

    // 1. Find the row with the matching agenda number
    const findResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const rows = findResponse.data.values;
    if (!rows) {
      return res.status(404).json({ message: "Sheet not found or empty" });
    }

    const rowIndex = rows.findIndex(
      (row, index) => index > 0 && row[0] === agendaNo
    );

    if (rowIndex === -1) {
      return res
        .status(404)
        .json({ message: `Agenda number ${agendaNo} not found` });
    }

    const actualRowNumber = rowIndex + 1; // +1 because sheets are 1-indexed and we skip header

    // 2. Update the specific row
    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!F${actualRowNumber}:I${actualRowNumber}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[lastExpedition, currentLocation, status, signature || ""]],
      },
    });

    res.json({
      message: "Sheet updated successfully",
      updatedRange: updateResponse.data.updatedRange,
    });
  } catch (error: any) {
    console.error("Full error object:", JSON.stringify(error, null, 2));
    if (error instanceof Error) {
        res.status(500).json({ message: "Error updating spreadsheet", error: error.message, details: error.stack });
    } else {
        res.status(500).json({ message: "An unknown error occurred", details: error });
    }
  }
};
