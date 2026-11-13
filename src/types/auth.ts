export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  error: string | null;
  isLoading: boolean;
  scope: string | null;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

export interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
  appId?: string;
}

