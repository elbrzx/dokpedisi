// Google Sheets Configuration
export const GOOGLE_SHEETS_CONFIG = {
  SPREADSHEET_ID: '19FgFYyhgnMmWIVIHK-1cOmgrQIik_j4mqUnLz5aArR4',
  SHEET_NAME: 'SURATMASUK',
  DATA_RANGE: 'A2:G',
  
  // Service Account Credentials
  SERVICE_ACCOUNT: {
    type: "service_account",
    project_id: "docupr-467003",
    private_key_id: "56e6106270647507044417f0ea8d2de98cf9dd55",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDZJwLNrxOIZNcE\nRNlmCLfojgrQy/Hu6i+jpEMiyPZOkL4cRnCf/nSC6cAGD6YDvNWpItAE5nuiGl78\nhGgxZHKKTRZSs69yCvV+tBqNc31auUo0osg6b96e9Fw5z/35hPqlxSB2/xKoCwgN\nj8wUhZHNnkNI/cSFSYffheK18G5St/YH649o7Xxbe/4P5NqfWiCXtLTLWhD4mGZX\n3y4yn8x5LQ3CToDgrMl954Uwy/ltmf8dAkDdM2S0sqngR7AVIqwyleNy53uEzul3\nlKFHaY+7cIg11PIv+p0qKN+DICD8F5qhWCJwR+n/SadBfhSrLWrKh4fI2tcst+tn\nEKH4JMC1AgMBAAECggEAIbMCpd3eJ6QSlDiFDmca902X0xhbVsrkEr6qporOYpnm\nzueFkebAuRJCeQ5Toq/a7pEW/DOyixERnZmEu+mNNvZImRQGjamyuHOFzV7XXM11\nfR6n+R2kTEG60EP9c4wWA8TISX9DK23u1X/z2VlzK5g8c+bh6RdkrSUPblG+JTrb\nANYhyLrOB+DUWlCdcolE5RAqfRMgtOIjADCNglEn7npadV+04SvO+2V6lmTA9zPp\n27FydGxZjUvO/fNPM+lv+9GS9jzwWqmkJ6MhqP0mvLi/J4KklcLj1ifdM/4n6yz/\n/arnHQdQtXDQYYqVsmQQA1E3e+fFp7lXLf/DQP5cYQKBgQD3gSq+RfsOFrrthHDw\nkmB5borv2S+B7zew61Fq3dDOcjAvlpeC3g+Kp2gS8X/n40D0HE0YhSLEavGsJCwi\nQVJBNssOLc4MH0cvAWweanXI2hPM0lCww4Z+0TiFboQ/0RCpMVG15cYffTKKfGes\n1LUwR2Dur0yWQI6oe9s1dlZFcQKBgQDgmyNezSzVRo6xJMToTClAtQX82CY1rgyg\n4F0KM/tMnq9rNbdQJU64ny+Xmp71qjElSoA4N6zMmQH80nbetVQm8Lpwl19rmxgG\nWDkQ7Jz+pkYrYUGgPp49TnAFnFvY4OarfweTJGp22+luin2c1ejLgw6QnTr/4ZOy\n3sAlhNL9hQKBgF/st9w20y6KsLgNdJhIowttRHvg+QCq7jKrgUqh3aOlrfdDrkUS\nO4PJjhSJdMEy2qHBtj+ime72Y+QLwO8l0fNkgR5lsk4QcU5OhtDjAfNuUe44NP3N\nSfssq3NLegYhyQtKChktjLP3mfcCcEwTxIWJpI/dcRlqu9+g4Ty/OICBAoGAbSz7\n1GkHEeRqF9E3pXLf2oQjlPO8HvurR8fHcd4ymNvJiONjZ6G60iMOjzKpceB4YxgD\nm0/0vr7hKHNlNHwPm54IAhKSX0vUMcFQe9mHtoA8O3na3HmTkVk/Onr2akVn2pS0\nqeFZnszmesT2qfWQYtwhiEnlE9wiXx/HZnVZ2cECgYAyxI1ELgL/CGaWyJJZxWUi\nWPWXyd0rQj8tk3/cOLATsQdhj/Y2r61wpE+dVI/PEH/l4SQ5TLMN2IYMBr8j/bBn\n5vGiqQRAtR9UW+fdmfOKNdsYMDckthNlrn5+KNqj+M38LJF6qnl2C/cikPeFnL5A\nW70JTKJJCG3luggcN0qhDw==\n-----END PRIVATE KEY-----\n",
    client_email: "dokpedisi-agent@docupr-467003.iam.gserviceaccount.com",
    client_id: "105578845251270248042",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/dokpedisi-agent%40docupr-467003.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  }
};

// Data mapping configuration
export const DATA_MAPPING = {
  AGENDA_NUMBER: {
    column: 'A',
    label: 'No Agenda',
    range: 'A2:A'
  },
  SENDER: {
    column: 'D',
    label: 'Pengirim',
    range: 'D2:D'
  },
  PERIHAL: {
    column: 'E',
    label: 'Perihal',
    range: 'E2:E'
  },
  LAST_EXPEDITION: {
    column: 'F',
    label: 'Last Expedition',
    range: 'F2:F'
  },
  CURRENT_LOCATION: {
    column: 'G',
    label: 'Current Location',
    range: 'G2:G'
  },
  STATUS: {
    column: 'H',
    label: 'Status',
    range: 'H2:H'
  },
  SIGNATURE: {
    column: 'I',
    label: 'Signature',
    range: 'I2:I'
  }
};

// API endpoints
export const API_ENDPOINTS = {
  GOOGLE_SHEETS: '/.netlify/functions/google-sheets',
  CSV_EXPORT: (spreadsheetId: string, sheetName: string) => 
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`
};
