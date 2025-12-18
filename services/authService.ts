import { User } from '../types';

declare var gapi: any;
declare var google: any;

const CLIENT_ID = '1008158953225-0049gdts0shep5vjob7ffid21pg1k5kl.apps.googleusercontent.com';
// Note: We do NOT use process.env.API_KEY here for gapi.client.init. 
// The environment API Key is typically restricted to Gemini (Generative Language API) 
// and causes "API key not valid" errors when passed to the Sheets API via gapi.
// We rely on the OAuth2 access token for Sheets API authorization.
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
const AUTH_STORAGE_KEY = 'math_facilitator_auth_active';

class AuthService {
  private tokenClient: any = null;
  private tokenExpiresAt: number = 0;
  private refreshResolver: Promise<void> | null = null;
  private isInitialized = false;

  constructor() {
    this.tokenClient = null;
  }

  // 1. Initialize Client (Load Scripts -> Init gapi -> Init TokenClient)
  async initClient(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      await this.loadScripts();
      
      // Init gapi client
      await new Promise<void>((resolve, reject) => {
        gapi.load('client', async () => {
          try {
            // Initialize without API Key to prevent 400 Invalid Key errors.
            // OAuth2 token will handle authorization for Sheets API calls.
            await gapi.client.init({
                discoveryDocs: DISCOVERY_DOCS,
            });
            resolve();
          } catch (e: any) {
            console.error("gapi.client.init failed:", JSON.stringify(e, null, 2));
            // Even if init fails (e.g. network), we reject to notify the app
            reject(e);
          }
        });
      });

      // Init GIS Token Client
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
          throw new Error("Google Identity Services script not loaded correctly.");
      }

      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp: any) => {
            if (resp.error !== undefined) {
                console.error("Token Callback Error:", resp);
                throw (resp);
            }
            this.handleTokenResponse(resp);
        },
      });

      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error("Auth init failed", JSON.stringify(error, null, 2));
      return false;
    }
  }

  // Helper to load external scripts dynamically
  private loadScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if scripts are already loaded
      if (typeof gapi !== 'undefined' && typeof google !== 'undefined' && google.accounts) {
        resolve();
        return;
      }

      let intervalCount = 0;
      const checkInterval = setInterval(() => {
        intervalCount++;
        if (typeof gapi !== 'undefined' && typeof google !== 'undefined' && google.accounts) {
          clearInterval(checkInterval);
          resolve();
        }
        // Safety break after 15 seconds (approx 150 checks)
        if (intervalCount > 150) {
            clearInterval(checkInterval);
            reject(new Error("Timeout waiting for Google scripts to load"));
        }
      }, 100);
    });
  }

  private handleTokenResponse(resp: any) {
    if (resp && resp.access_token) {
        // Calculate expiration time (default to 3599s)
        const expiresIn = Number(resp.expires_in) || 3599;
        this.tokenExpiresAt = Date.now() + (expiresIn * 1000);
        
        // Set token to gapi
        const tokenObj = {
            access_token: resp.access_token,
            expires_in: resp.expires_in
        };
        gapi.client.setToken(tokenObj);

        // Mark session as active in storage
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    }
  }

  // 2. Authentication Flow
  signIn(): Promise<User> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error("TokenClient not initialized"));
        return;
      }

      // Override callback for this specific request to resolve the promise
      this.tokenClient.callback = async (resp: any) => {
        if (resp.error) {
          reject(resp);
          return;
        }
        this.handleTokenResponse(resp);
        try {
            const user = await this.fetchUserInfo();
            resolve(user);
        } catch(e) {
            reject(e);
        }
      };

      // Trigger popup
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  async signOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            console.log('Revoked');
        });
        gapi.client.setToken(null);
        this.tokenExpiresAt = 0;
        localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  // Restore session on reload
  async restoreSession(): Promise<User | null> {
    const hasSession = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!hasSession) return null;

    try {
        await this.ensureAuth(); // This will trigger silent refresh
        return await this.fetchUserInfo();
    } catch (e) {
        console.warn("Failed to restore session", e);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
    }
  }

  // 3. Token Management & Guard
  async ensureAuth(): Promise<void> {
    // 5 minutes buffer
    const isExpired = Date.now() > (this.tokenExpiresAt - 5 * 60 * 1000);
    
    if (!isExpired) {
        return;
    }

    // Lock to prevent multiple refreshes
    if (this.refreshResolver) {
        return this.refreshResolver;
    }

    this.refreshResolver = new Promise((resolve, reject) => {
        if (!this.tokenClient) {
             // Try to initialize if missing (rare case)
             this.initClient().then(() => {
                 if(!this.tokenClient) {
                     reject("Failed to init token client for refresh"); 
                     return;
                 }
                 this.performSilentRefresh(resolve, reject);
             }).catch(reject);
        } else {
             this.performSilentRefresh(resolve, reject);
        }
    });

    try {
        await this.refreshResolver;
    } finally {
        this.refreshResolver = null;
    }
  }

  private performSilentRefresh(resolve: () => void, reject: (reason?: any) => void) {
      // Set temporary callback for refresh
      this.tokenClient.callback = (resp: any) => {
          if (resp.error) {
              console.warn("Silent refresh failed:", resp.error);
              localStorage.removeItem(AUTH_STORAGE_KEY); // Clear session on failure
              reject(resp);
          } else {
              this.handleTokenResponse(resp);
              resolve();
          }
      };

      // Silent refresh
      this.tokenClient.requestAccessToken({ prompt: 'none' });
  }

  // 4. User Info
  private async fetchUserInfo(): Promise<User> {
    const token = gapi.client.getToken();
    if (!token) throw new Error("No access token found");

    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
            'Authorization': `Bearer ${token.access_token}`
        }
    });
    
    if (!response.ok) {
        throw new Error("Failed to fetch user profile");
    }

    const data = await response.json();
    return {
        email: data.email,
        name: data.name,
        picture: data.picture
    };
  }
}

export const authService = new AuthService();