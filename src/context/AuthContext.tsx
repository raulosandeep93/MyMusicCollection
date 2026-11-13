import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { GoogleUser } from '../types/auth';
import {
  requestToken,
  fetchUserProfile,
  signOut,
  isTokenValid,
  getActiveScope,
  getGoogleConfig,
  SCOPE_DRIVE_FILE,
} from '../services/auth';
import { setSetting } from '../services/db';

interface AuthContextType {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  isLoading: boolean;
  error: string | null;
  activeScope: string;
  config: { clientId: string; apiKey: string; appId?: string };
  signIn: (forceConsent?: boolean, targetScope?: string) => Promise<boolean>;
  signOutUser: () => Promise<void>;
  updateConfig: (clientId: string, apiKey: string, appId?: string) => Promise<void>;
  switchScope: (scope: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScope, setActiveScopeState] = useState<string>(SCOPE_DRIVE_FILE);
  const [config, setConfig] = useState<{ clientId: string; apiKey: string; appId?: string }>({
    clientId: '',
    apiKey: '',
    appId: '',
  });

  // Load configuration on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const conf = await getGoogleConfig();
        setConfig(conf);
      } catch (err: any) {
        console.error('Failed to load Google configuration:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  const updateConfig = useCallback(async (clientId: string, apiKey: string, appId?: string) => {
    await setSetting('custom_client_id', clientId.trim());
    await setSetting('custom_api_key', apiKey.trim());
    if (appId) {
      await setSetting('custom_app_id', appId.trim());
    }
    setConfig({ clientId: clientId.trim(), apiKey: apiKey.trim(), appId: appId?.trim() });
  }, []);

  const signIn = useCallback(
    async (forceConsent = false, targetScope = SCOPE_DRIVE_FILE): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const prompt = forceConsent ? 'consent' : '';
        await requestToken(prompt, targetScope);
        const profile = await fetchUserProfile();
        setUser(profile);
        setIsAuthenticated(true);
        setActiveScopeState(getActiveScope());
        return true;
      } catch (err: any) {
        // If silent request failed and forceConsent wasn't already set, retry with user consent
        if (!forceConsent && err.message?.includes('OAuth Error')) {
          try {
            await requestToken('consent', targetScope);
            const profile = await fetchUserProfile();
            setUser(profile);
            setIsAuthenticated(true);
            setActiveScopeState(getActiveScope());
            return true;
          } catch (retryErr: any) {
            setError(retryErr.message || 'Authentication failed');
            return false;
          }
        }
        setError(err.message || 'Authentication failed');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const switchScope = useCallback(
    async (newScope: string): Promise<boolean> => {
      return signIn(true, newScope);
    },
    [signIn]
  );

  const signOutUser = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut(user?.email);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Periodic check for token validity
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && !isTokenValid()) {
        // Attempt silent refresh
        signIn(false, activeScope).catch(() => {
          setIsAuthenticated(false);
        });
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isAuthenticated, activeScope, signIn]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        error,
        activeScope,
        config,
        signIn,
        signOutUser,
        updateConfig,
        switchScope,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
