// src/google-sheets.ts
import { Document, ExpeditionEntry } from './types';
import { parseCSV, fetchWithTimeout } from './csv-utils';

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
}

/* ------------------------------------------------------------------ */
/*   Konfigurasi sheet – ganti bila diperlukan                           */
/* ------------------------------------------------------------------ */
export const SHEET_CONFIG: GoogleSheetsConfig = {
  spreadsheetId: '19FgFYyhgnMmWIVIHK-1cOmgrQIik_j4mqUnLz5aArR4',
  sheetName: 'SURATMASUK',
};

/* ------------------------------------------------------------------ */
/*   1️⃣  Ambil seluruh CSV dari Google Sheet                           */
/* ------------------------------------------------------------------ */
async function fetchEntireSheet(
  { spreadsheetId, sheetName }: GoogleSheetsConfig,
): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName,
  )}`;

  const resp = await fetchWithTimeout(url);
  if (!resp.ok) {
    throw new Error(`GET ${url} → ${resp.status} ${resp.statusText}`);
  }

  const csv = await resp.text();
  const rows = parseCSV(csv);

  // Buang header (baris pertama) dan baris yang semuanya kosong
  return rows.filter((r, i) => i > 0 && r.some(c => c.trim() !== ''));
}

/* ------------------------------------------------------------------ */
/*   2️⃣  Ubah satu baris CSV → objek Document                         */
/* ------------------------------------------------------------------ */
function parseDateFromDMY(str: string | undefined): Date {
  if (!str) return new Date(0);
  const parts = str.split('/');
  if (parts.length !== 3) return new Date(0);

  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1; // 0‑based
  const year = Number(parts[2]);

  const d = new Date(Date.UTC(year, month, day));
  return isNaN(d.getTime()) ? new Date(0) : d;
}

/** Meng‑parse satu entri “history” yang berada pada kolom 7‑dst. */
function buildExpeditionHistory(row: string[]): ExpeditionEntry[] {
  const history: ExpeditionEntry[] = [];

  for (let i = 6; i + 2 < row.length; i += 3) {
    const rawDetails = row[i]?.trim();
    const recipient = row[i + 1]?.trim();
    const signature = row[i + 2]?.trim() || undefined;

    if (!rawDetails || !recipient) break; // tidak ada lagi data yang valid

    // Catatan (opsional)
    const notesMatch = rawDetails.match(/Catatan:\s*(.*)/);
    const notes = notesMatch && notesMatch[1] !== '-' ? notesMatch[1] : null;

    // Extract tanggal “Diterima pada YYYY-MM-DD …”
    const datePart = rawDetails
      .split('. Catatan:')[0]
      .replace('Diterima pada ', '')
      .trim()
      .split(' jam ')[0]; // format “YYYY-MM-DD”

    const [y, m, d] = datePart.split('-').map(Number);
    const ts = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1));

    history.push({
      timestamp: isNaN(ts.getTime()) ? new Date(0) : ts,
      recipient,
      signature,
      notes,
      details: rawDetails,
    });
  }

  return history;
}

/** Convert satu baris menjadi Document. Mengembalikan `null` bila data tidak valid. */
function convertRowToDocument(row: string[], index: number): Document | null {
  const agendaNo = row[0]?.trim();
  if (!agendaNo) return null; // baris tanpa agenda tidak diproses

  const createdAt = parseDateFromDMY(row[1]);
  const sender = row[2]?.trim() ?? '';
  const perihal = row[3]?.trim() ?? '';

  const expeditionHistory = buildExpeditionHistory(row);
  const lastEntry = expeditionHistory[expeditionHistory.length - 1];

  const currentStatus = expeditionHistory.length ? 'Signed' : 'Unknown';

  return {
    id: `${agendaNo}-${index}`,
    agendaNo,
    sender,
    perihal,
    createdAt,
    currentStatus,
    position: currentStatus,               // kept for backward compatibility
    expeditionHistory,
    currentRecipient: lastEntry?.recipient,
    lastExpedition: lastEntry?.details,
    signature: lastEntry?.signature,
    isFromGoogleSheets: true,
    tanggalTerima: lastEntry?.timestamp,
  };
}

/* ------------------------------------------------------------------ */
/*   3️⃣  API publik – ambil semua dokumen                              */
/* ------------------------------------------------------------------ */
export async function fetchDocumentsFromGoogleSheets(): Promise<{
  documents: Document[];
  total: number;
}> {
  try {
    const rows = await fetchEntireSheet(SHEET_CONFIG);
    const total = rows.length;

    const docs: Document[] = rows
      .map((r, i) => convertRowToDocument(r, i))
      .filter((d): d is Document => d !== null);

    // Urutkan terbaru → terlama
    docs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { documents: docs, total };
  } catch (e) {
    console.error('❌ fetchDocumentsFromGoogleSheets:', e);
    return { documents: [], total: 0 };
  }
}

/* ------------------------------------------------------------------ */
/*   4️⃣  Konversi tanda tangan (canvas → JPEG low‑res)                */
/* ------------------------------------------------------------------ */
export async function convertSignatureToLowResJPEG(
  dataUrl: string,
): Promise<string> {
  return new Promise(resolve => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');

      if (!ctx) return resolve(dataUrl);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.3));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch (_) {
      resolve(dataUrl);
    }
  });
}

/* ------------------------------------------------------------------ */
/*   5️⃣  Update sheet melalui endpoint backend (tidak langsung ke Google) */
/* ------------------------------------------------------------------ */
export async function updateSpreadsheetWithExpedition(
  agendaNo: string,
  lastExpedition: string,
  currentLocation: string,
  status: string,
  signature?: string,
): Promise<boolean> {
  try {
    const resp = await fetch('/api/update-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agendaNo,
        lastExpedition,
        currentLocation,
        status,
        signature,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message ?? resp.statusText);
    }

    await resp.json(); // biasanya berisi { success: true }
    return true;
  } catch (e) {
    console.error('❌ updateSpreadsheetWithExpedition:', e);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*   6️⃣  Statistik sederhana sheet                                    */
/* ------------------------------------------------------------------ */
export async function getSheetStats(): Promise<{
  totalRows: number;
  lastUpdate: Date;
}> {
  try {
    const rows = await fetchEntireSheet(SHEET_CONFIG);
    return { totalRows: rows.length, lastUpdate: new Date() };
  } catch (e) {
    console.error('❌ getSheetStats:', e);
    return { totalRows: 0, lastUpdate: new Date() };
  }
}
