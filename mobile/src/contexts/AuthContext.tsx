import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus, Platform } from 'react-native';
import pb from '@/lib/pocketbase';
import { deriveKey, generateSalt, hashPassword } from '@/lib/encryption';
import type { User } from '@/types';

// Secure storage wrapper that falls back to localStorage on web
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

interface UserSettings {
  id: string;
  user: string;
  master_salt: string;
  master_hash: string;
}

interface AuthContextType {
  user: User | null;
  encryptionKey: string | null;
  isLoading: boolean;
  isLocked: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  unlock: (masterPassword: string) => Promise<boolean>;
  lock: () => void;
  setMasterPassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Secure store keys (local cache only)
const AUTH_TOKEN_KEY = 'pbAuthToken';
const AUTH_MODEL_KEY = 'pbAuthModel';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  
  const lastActivityRef = useRef(Date.now());
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user settings from PocketBase
  const fetchUserSettings = useCallback(async (userId: string): Promise<UserSettings | null> => {
    try {
      const records = await pb.collection('user_settings').getList<UserSettings>(1, 1, {
        filter: `user = "${userId}"`,
      });
      
      if (records.items.length > 0) {
        return records.items[0];
      }
      return null;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }
  }, []);

  // Save user settings to PocketBase
  const saveUserSettings = useCallback(async (userId: string, salt: string, hash: string): Promise<UserSettings> => {
    try {
      const existing = await fetchUserSettings(userId);
      
      if (existing) {
        const updated = await pb.collection('user_settings').update<UserSettings>(existing.id, {
          master_salt: salt,
          master_hash: hash,
        });
        return updated;
      } else {
        const created = await pb.collection('user_settings').create<UserSettings>({
          user: userId,
          master_salt: salt,
          master_hash: hash,
        });
        return created;
      }
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }, [fetchUserSettings]);

  // Lock the app
  const lock = useCallback(() => {
    setEncryptionKey(null);
    setIsLocked(true);
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    pb.authStore.clear();
    setUser(null);
    setEncryptionKey(null);
    setUserSettings(null);
    setIsLocked(false);
    
    // Clear stored auth
    try {
      await storage.deleteItem(AUTH_TOKEN_KEY);
      await storage.deleteItem(AUTH_MODEL_KEY);
    } catch (e) {
      console.error('Error clearing auth store:', e);
    }
  }, []);

  // Reset activity timer
  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
    }
    
    if (encryptionKey) {
      lockTimeoutRef.current = setTimeout(() => {
        lock();
      }, LOCK_TIMEOUT);
    }
  }, [encryptionKey, lock]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Check if timeout has passed
        const now = Date.now();
        if (now - lastActivityRef.current > LOCK_TIMEOUT && encryptionKey) {
          lock();
        } else {
          resetActivityTimer();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Lock immediately when app goes to background (for security)
        if (encryptionKey) {
          lock();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
    };
  }, [encryptionKey, lock, resetActivityTimer]);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to restore auth from secure store
        const token = await storage.getItem(AUTH_TOKEN_KEY);
        const modelStr = await storage.getItem(AUTH_MODEL_KEY);
        
        if (token && modelStr) {
          const model = JSON.parse(modelStr);
          pb.authStore.save(token, model);
          
          if (pb.authStore.isValid) {
            setUser({
              id: model.id,
              email: model.email,
              name: model.name || '',
              created: model.created,
              updated: model.updated,
            });
            
            // Fetch user settings from PocketBase
            const settings = await fetchUserSettings(model.id);
            setUserSettings(settings);
            
            setIsLocked(true); // Require master password unlock
          } else {
            // Token is invalid, clear it
            await logout();
          }
        }
      } catch (e) {
        console.error('Error restoring auth:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [fetchUserSettings, logout]);

  // Login
  const login = async (email: string, password: string) => {
    const authData = await pb.collection('users').authWithPassword(email, password);
    
    // Save auth to secure store
    await storage.setItem(AUTH_TOKEN_KEY, pb.authStore.token);
    await storage.setItem(AUTH_MODEL_KEY, JSON.stringify(authData.record));
    
    const userId = authData.record.id;
    
    setUser({
      id: userId,
      email: authData.record.email,
      name: authData.record.name || '',
      created: authData.record.created,
      updated: authData.record.updated,
    });
    
    // Fetch user settings from PocketBase
    const settings = await fetchUserSettings(userId);
    setUserSettings(settings);
    
    setIsLocked(true); // Require master password
  };

  // Register
  const register = async (email: string, password: string, name: string) => {
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      name,
    });
    // Auto-login after registration
    await login(email, password);
  };

  // Set master password (first time setup)
  const setMasterPassword = async (password: string) => {
    if (!user) throw new Error('No user logged in');
    
    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    const key = deriveKey(password, salt);
    
    // Save to PocketBase (shared across devices)
    const settings = await saveUserSettings(user.id, salt, hash);
    setUserSettings(settings);
    
    setEncryptionKey(key);
    setIsLocked(false);
    resetActivityTimer();
  };

  // Unlock with master password
  const unlock = async (password: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Always fetch fresh settings from PocketBase to ensure sync across devices
      let settings = userSettings;
      if (!settings) {
        settings = await fetchUserSettings(user.id);
        if (settings) {
          setUserSettings(settings);
        }
      }
      
      const storedSalt = settings?.master_salt;
      const storedHash = settings?.master_hash;
      
      if (!storedSalt || !storedHash) {
        // First time - set the master password
        await setMasterPassword(password);
        return true;
      }
      
      const hash = hashPassword(password, storedSalt);
      if (hash === storedHash) {
        const key = deriveKey(password, storedSalt);
        setEncryptionKey(key);
        setIsLocked(false);
        resetActivityTimer();
        return true;
      }
      
      return false;
    } catch (e) {
      console.error('Error unlocking:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        encryptionKey,
        isLoading,
        isLocked,
        login,
        register,
        logout,
        unlock,
        lock,
        setMasterPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
