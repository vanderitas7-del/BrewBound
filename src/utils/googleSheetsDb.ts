import { CoffeeShop } from '../types';

export interface GoogleDriveFolder {
  id: string;
  name: string;
  webViewLink: string;
}

export interface GoogleSheetDatabase {
  id: string;
  name: string;
  webViewLink: string;
  folderId?: string;
  lastSyncedAt?: string;
  totalRecords?: number;
}

const FOLDER_NAME = '📁 BrewBound Calamba - GIS Coffee Shop Database';
const SPREADSHEET_TITLE = '📊 BrewBound_Poblacion1-7_Permanent_Database';
const SHEET_RANGE = 'Master_Repository!A:Q';

const SHEET_HEADERS = [
  'Cafe ID',
  'Establishment Name',
  'Barangay ID',
  'Barangay Name',
  'Full Street Address',
  'Landmark Reference',
  'Price Range',
  'Latitude (GIS)',
  'Longitude (GIS)',
  'Wi-Fi Speed (Mbps)',
  'Power Outlets',
  'Air Conditioned',
  'Noise Level',
  'Rating',
  'Verified By',
  'Timestamp Added (PHT)',
  'Permanent Database Status'
];

class GoogleWorkspaceService {
  private accessToken: string | null = null;
  private tokenClient: any = null;

  constructor() {
    this.accessToken = localStorage.getItem('brewbound_google_access_token');
  }

  public getStoredToken(): string | null {
    return this.accessToken;
  }

  public isConnected(): boolean {
    return !!this.accessToken;
  }

  public getStoredFolder(): GoogleDriveFolder | null {
    const saved = localStorage.getItem('brewbound_google_folder');
    return saved ? JSON.parse(saved) : null;
  }

  public getStoredSheet(): GoogleSheetDatabase | null {
    const saved = localStorage.getItem('brewbound_google_sheet');
    return saved ? JSON.parse(saved) : null;
  }

  public disconnect() {
    this.accessToken = null;
    localStorage.removeItem('brewbound_google_access_token');
  }

  // Request Access Token using Google Identity Services GIS token client
  public async authenticate(clientId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (typeof window.google === 'undefined' || !window.google?.accounts?.oauth2) {
        // If GIS script not yet loaded or client ID pending, return error with explanation
        reject(new Error('Google Identity Services not ready or client ID required.'));
        return;
      }

      const effectiveClientId = clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '59655310554-placeholder.apps.googleusercontent.com';

      try {
        // @ts-ignore
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: effectiveClientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
          callback: (response: any) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            if (response.access_token) {
              this.accessToken = response.access_token;
              localStorage.setItem('brewbound_google_access_token', response.access_token);
              resolve(response.access_token);
            } else {
              reject(new Error('No access token received from Google.'));
            }
          },
        });

        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  public setDirectToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('brewbound_google_access_token', token);
  }

  // Find or Create the Dedicated Google Drive Folder
  public async getOrCreateDriveFolder(token?: string): Promise<GoogleDriveFolder> {
    const activeToken = token || this.accessToken;
    if (!activeToken) throw new Error('Not authenticated with Google Workspace');

    // 1. Search if folder already exists in Google Drive
    const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${FOLDER_NAME}' and trashed = false`;
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${activeToken}` },
      }
    );

    if (!searchRes.ok) {
      const err = await searchRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to search Google Drive folders');
    }

    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const existingFolder: GoogleDriveFolder = {
        id: searchData.files[0].id,
        name: searchData.files[0].name,
        webViewLink: searchData.files[0].webViewLink || `https://drive.google.com/drive/folders/${searchData.files[0].id}`,
      };
      localStorage.setItem('brewbound_google_folder', JSON.stringify(existingFolder));
      return existingFolder;
    }

    // 2. Create the folder in Google Drive
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${activeToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'BrewBound Calamba - Non-Client GIS Coffee Shop Master Database and Map Records',
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create Google Drive folder');
    }

    const newFolderData = await createRes.json();
    const newFolder: GoogleDriveFolder = {
      id: newFolderData.id,
      name: FOLDER_NAME,
      webViewLink: `https://drive.google.com/drive/folders/${newFolderData.id}`,
    };

    localStorage.setItem('brewbound_google_folder', JSON.stringify(newFolder));
    return newFolder;
  }

  // Find or Create Master Google Spreadsheet inside the Google Drive Folder
  public async getOrCreateSpreadsheet(
    folderId: string,
    initialShops: CoffeeShop[] = [],
    token?: string
  ): Promise<GoogleSheetDatabase> {
    const activeToken = token || this.accessToken;
    if (!activeToken) throw new Error('Not authenticated with Google Workspace');

    // 1. Search if Spreadsheet exists inside the folder or root
    const query = `mimeType = 'application/vnd.google-apps.spreadsheet' and name = '${SPREADSHEET_TITLE}' and trashed = false`;
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${activeToken}` },
      }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const existingSheet: GoogleSheetDatabase = {
          id: searchData.files[0].id,
          name: searchData.files[0].name,
          webViewLink: searchData.files[0].webViewLink || `https://docs.google.com/spreadsheets/d/${searchData.files[0].id}`,
          folderId,
          lastSyncedAt: new Date().toLocaleTimeString(),
        };
        localStorage.setItem('brewbound_google_sheet', JSON.stringify(existingSheet));
        return existingSheet;
      }
    }

    // 2. Create New Google Spreadsheet via Google Sheets API
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${activeToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: SPREADSHEET_TITLE,
          locale: 'en_PH',
          timeZone: 'Asia/Manila',
        },
        sheets: [
          {
            properties: {
              title: 'Master_Repository',
              gridProperties: {
                frozenRowCount: 1,
                columnCount: 20,
              },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
    }

    const sheetData = await createRes.json();
    const spreadsheetId = sheetData.spreadsheetId;

    // 3. Move spreadsheet into the dedicated Drive folder
    try {
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${folderId}&fields=id,parents`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${activeToken}` },
        }
      );
    } catch (e) {
      console.warn('Could not move file to folder parents:', e);
    }

    // 4. Format Header Row and Apply Permanent Audit Styling
    await this.initializeSheetHeaders(spreadsheetId, activeToken);

    // 5. If initial cafes provided, seed the master Google Sheet
    if (initialShops.length > 0) {
      await this.batchAppendShops(spreadsheetId, initialShops, activeToken);
    }

    const newSheetRecord: GoogleSheetDatabase = {
      id: spreadsheetId,
      name: SPREADSHEET_TITLE,
      webViewLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      folderId,
      lastSyncedAt: new Date().toLocaleTimeString(),
      totalRecords: initialShops.length,
    };

    localStorage.setItem('brewbound_google_sheet', JSON.stringify(newSheetRecord));
    return newSheetRecord;
  }

  // Format Header Row
  private async initializeSheetHeaders(spreadsheetId: string, token: string) {
    // Insert Header Text
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Master_Repository!A1:Q1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [SHEET_HEADERS],
        }),
      }
    );

    // Style Header Row (Dark Amber background, White bold text)
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.85, green: 0.45, blue: 0.08 },
                    textFormat: {
                      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                      bold: true,
                      fontSize: 10,
                    },
                    horizontalAlignment: 'CENTER',
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
              },
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: 17,
                },
              },
            },
          ],
        }),
      });
    } catch (e) {
      console.warn('Formatting header failed:', e);
    }
  }

  // Converts a CoffeeShop object into a Google Sheet Row Array
  private shopToRow(shop: CoffeeShop): (string | number | boolean)[] {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
    return [
      shop.id,
      shop.name,
      shop.barangayId,
      shop.barangayName,
      shop.address,
      shop.landmark || '',
      shop.priceRange || '₱120 - ₱220',
      shop.lat,
      shop.lng,
      shop.amenities.wifiSpeedMbps || 0,
      shop.amenities.outletCount || 0,
      shop.amenities.acAvailable ? 'YES' : 'NO',
      shop.amenities.noiseLevel || 'Quiet / Study-Friendly',
      shop.rating || 4.5,
      shop.amenities.verifiedBy || 'CCC BSIT Field Researcher',
      timestamp,
      'PERMANENT_IMMUTABLE_RECORD (Non-Removable)',
    ];
  }

  // Appends a new coffee shop to Google Sheets permanently
  public async appendShopToPermanentDatabase(
    spreadsheetId: string,
    shop: CoffeeShop,
    token?: string
  ): Promise<boolean> {
    const activeToken = token || this.accessToken;
    if (!activeToken) throw new Error('Not authenticated with Google Workspace');

    const row = this.shopToRow(shop);

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Master_Repository!A:Q:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [row],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to append establishment to Google Sheets');
    }

    return true;
  }

  // Batch append multiple coffee shops
  public async batchAppendShops(
    spreadsheetId: string,
    shops: CoffeeShop[],
    token?: string
  ): Promise<boolean> {
    const activeToken = token || this.accessToken;
    if (!activeToken) throw new Error('Not authenticated with Google Workspace');

    const rows = shops.map((s) => this.shopToRow(s));

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Master_Repository!A:Q:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows,
        }),
      }
    );

    return res.ok;
  }

  // Read all establishments from the permanent Google Sheet
  public async fetchShopsFromSheet(spreadsheetId: string, token?: string): Promise<CoffeeShop[]> {
    const activeToken = token || this.accessToken;
    if (!activeToken) throw new Error('Not authenticated with Google Workspace');

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Master_Repository!A2:Q100`,
      {
        headers: { Authorization: `Bearer ${activeToken}` },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to read from Google Sheet');
    }

    const data = await res.json();
    const rows = data.values || [];

    return rows.map((r: any[], idx: number) => {
      const id = r[0] || `cafe-sheet-${idx + 1}`;
      const name = r[1] || `Cafe ${idx + 1}`;
      const barangayId = Number(r[2]) || 1;
      const barangayName = r[3] || `Barangay ${barangayId}`;
      const address = r[4] || '';
      const landmark = r[5] || '';
      const priceRange = r[6] || '₱120 - ₱220';
      const lat = parseFloat(r[7]) || 14.2135;
      const lng = parseFloat(r[8]) || 121.1642;
      const wifiSpeedMbps = parseInt(r[9]) || 35;
      const outletCount = parseInt(r[10]) || 10;
      const acAvailable = r[11] === 'YES' || r[11] === true;
      const noiseLevel = r[12] || 'Quiet / Study-Friendly';
      const rating = parseFloat(r[13]) || 4.5;
      const verifiedBy = r[14] || 'CCC BSIT Field Researcher';

      return {
        id,
        name,
        barangayId,
        barangayName,
        address,
        landmark,
        priceRange,
        minPrice: 120,
        maxPrice: 220,
        openingTime: '08:00',
        closingTime: '22:00',
        operatingHoursText: '8:00 AM - 10:00 PM',
        daysOpen: 'Monday to Sunday',
        lat,
        lng,
        rating,
        reviewCount: 1,
        verified: true,
        bannerImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
        galleryImages: [],
        description: `Verified establishment pinned in Poblacion ${barangayName}.`,
        amenities: {
          wifiAvailable: true,
          wifiSpeedMbps,
          wifiType: `High-Speed Fiber (${wifiSpeedMbps} Mbps)`,
          wifiPasswordProvided: true,
          outletCount,
          outletCoveragePercent: '80% of Tables',
          acAvailable,
          noiseLevel,
          seatingCapacity: 30,
          parkingInfo: 'Street Parking',
          paymentMethods: ['Cash', 'GCash'],
          studyFriendlyScore: 5,
          verifiedDate: 'March 2026',
          verifiedBy,
        },
        menu: [{ name: 'Signature Brew', price: 120, category: 'Coffee', popular: true }],
        reviews: [],
      } as CoffeeShop;
    });
  }
}

export const googleWorkspaceDb = new GoogleWorkspaceService();
