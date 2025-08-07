# Integrasi Google Sheets dengan Dokpedisi

## Overview

Aplikasi Dokpedisi telah diintegrasikan dengan Google Sheets untuk mengambil data dokumen dari spreadsheet. Integrasi ini menggunakan Google Sheets API dengan service account authentication.

## Konfigurasi

### Spreadsheet Details
- **Spreadsheet ID**: `19FgFYyhgnMmWIVIHK-1cOmgrQIik_j4mqUnLz5aArR4`
- **Sheet Name**: `SURATMASUK`
- **Data Range**: `A2:G` (dari baris 2 ke bawah)

### Mapping Data
Berdasarkan spesifikasi yang diberikan:

| Kolom Spreadsheet | Field Aplikasi | Label UI |
|-------------------|----------------|----------|
| A2:A | Agenda Number | "No Agenda" |
| D2:E | Sender | "Pengirim" |
| E2:G | Subject | "Perihal" |

## Implementasi

### 1. Google Sheets Service (`client/lib/googleSheetsService.ts`)
- Menyediakan dua metode untuk mengambil data:
  - `fetchDocumentsFromGoogleSheets()`: Menggunakan public CSV export
  - `fetchDocumentsFromGoogleSheetsAPI()`: Menggunakan Google Sheets API v4

### 2. Document Store (`client/lib/documentStore.ts`)
- Menambahkan state management untuk loading dan error handling
- Fungsi `loadDocumentsFromGoogleSheets()`: Memuat dan menggabungkan data
- Fungsi `refreshDocuments()`: Memperbarui data dari Google Sheets

### 3. Netlify Function (`netlify/functions/google-sheets.ts`)
- Server-side endpoint untuk Google Sheets API
- Menggunakan service account credentials
- Menangani CORS dan error handling

### 4. UI Updates (`client/pages/DocumentList.tsx`)
- Menambahkan loading indicator
- Error handling dan display
- Refresh button untuk memperbarui data
- Label yang diperbarui sesuai spesifikasi

## Cara Kerja

1. **Initial Load**: Saat komponen DocumentList dimuat, data otomatis diambil dari Google Sheets
2. **Fallback Strategy**: Jika API method gagal, sistem akan mencoba CSV export method
3. **Data Merging**: Data dari Google Sheets digabungkan dengan data lokal, menghindari duplikasi
4. **Real-time Refresh**: Pengguna dapat memperbarui data dengan tombol refresh

## Keamanan

- Service account credentials disimpan di server-side (Netlify Functions)
- Client-side hanya mengakses data melalui API endpoint yang aman
- CORS dikonfigurasi dengan benar untuk keamanan

## Dependencies

### Client-side
- Tidak ada dependency tambahan yang diperlukan

### Server-side (Netlify Functions)
- `@netlify/functions`: Untuk Netlify Functions
- `googleapis`: Untuk Google Sheets API

## Troubleshooting

### Error: "Failed to fetch from Google Sheets"
1. Periksa apakah spreadsheet sudah di-share dengan service account email
2. Pastikan service account memiliki permission untuk membaca spreadsheet
3. Periksa apakah spreadsheet ID dan sheet name sudah benar

### Error: "API request failed"
1. Periksa apakah Netlify Functions sudah di-deploy dengan benar
2. Pastikan dependencies sudah terinstall
3. Periksa logs Netlify Functions untuk detail error

### Data tidak muncul
1. Pastikan spreadsheet memiliki data di range A2:G
2. Periksa apakah format data sesuai dengan mapping yang diharapkan
3. Gunakan tombol refresh untuk memuat ulang data

## Pengembangan Selanjutnya

1. **Caching**: Implementasi caching untuk mengurangi API calls
2. **Real-time Updates**: Webhook untuk update otomatis saat spreadsheet berubah
3. **Bidirectional Sync**: Kemampuan untuk menulis kembali ke spreadsheet
4. **Multiple Sheets**: Support untuk multiple spreadsheet/sheet
5. **Data Validation**: Validasi data sebelum disimpan ke aplikasi
