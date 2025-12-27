"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import pb from '@/lib/pocketbase';
import { deriveKey, generateSalt, hashPassword } from '@/lib/encryption';
import type { User } from '@/types';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  
  // Use ref for last activity to avoid re-renders
  const lastActivityRef = useRef(Date.now());

  // Define lock first since it's used by the useEffect below
  const lock = useCallback(() => {
    setEncryptionKey(null);
    setIsLocked(true);
  }, []);

  const logout = useCallback(() => {
    pb.authStore.clear();
    setUser(null);
    setEncryptionKey(null);
    setUserSettings(null);
    setIsLocked(false);
  }, []);

  // Fetch or create user settings from PocketBase
  const fetchUserSettings = useCallback(async (userId: string): Promise<UserSettings | null> => {
    try {
      // Try to get existing settings
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
      // Check if settings exist
      const existing = await fetchUserSettings(userId);
      
      if (existing) {
        // Update existing
        const updated = await pb.collection('user_settings').update<UserSettings>(existing.id, {
          master_salt: salt,
          master_hash: hash,
        });
        return updated;
      } else {
        // Create new
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

  // Auto-lock after inactivity
  useEffect(() => {
    if (!user || !encryptionKey) return;

    const checkInactivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > LOCK_TIMEOUT) {
        lock();
      }
    };

    const interval = setInterval(checkInactivity, 10000);
    
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };
    
    // Throttle mouse events to avoid too many updates
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledUpdateActivity = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        updateActivity();
        throttleTimeout = null;
      }, 1000);
    };
    
    window.addEventListener('mousemove', throttledUpdateActivity);
    window.addEventListener('keydown', updateActivity);

    return () => {
      clearInterval(interval);
      if (throttleTimeout) clearTimeout(throttleTimeout);
      window.removeEventListener('mousemove', throttledUpdateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, [user, encryptionKey, lock]);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      if (pb.authStore.isValid && pb.authStore.model) {
        const model = pb.authStore.model;
        setUser({
          id: model.id,
          email: model.email,
          name: model.name || '',
          created: model.created,
          updated: model.updated,
        });
        
        // Fetch user settings
        const settings = await fetchUserSettings(model.id);
        setUserSettings(settings);
        
        setIsLocked(true); // Require master password unlock
      }
      setIsLoading(false);
    };

    initAuth();
  }, [fetchUserSettings]);

  const login = async (email: string, password: string) => {
    const authData = await pb.collection('users').authWithPassword(email, password);
    const userId = authData.record.id;
    
    setUser({
      id: userId,
      email: authData.record.email,
      name: authData.record.name || '',
      created: authData.record.created,
      updated: authData.record.updated,
    });
    
    // Fetch user settings
    const settings = await fetchUserSettings(userId);
    setUserSettings(settings);
    
    // After login, user needs to set/enter master password
    setIsLocked(true);
  };

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

  const setMasterPassword = async (password: string) => {
    if (!user) throw new Error('No user logged in');
    
    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    const key = deriveKey(password, salt);
    
    // Save to PocketBase
    const settings = await saveUserSettings(user.id, salt, hash);
    setUserSettings(settings);
    
    // Also save to localStorage as backup/cache
    localStorage.setItem(`masterSalt_${user.id}`, salt);
    localStorage.setItem(`masterHash_${user.id}`, hash);
    
    setEncryptionKey(key);
    setIsLocked(false);
    lastActivityRef.current = Date.now();
  };

  const unlock = async (password: string): Promise<boolean> => {
    if (!user) return false;
    
    // Try to get salt/hash from PocketBase first, fallback to localStorage
    let storedSalt = userSettings?.master_salt || localStorage.getItem(`masterSalt_${user.id}`);
    let storedHash = userSettings?.master_hash || localStorage.getItem(`masterHash_${user.id}`);
    
    // If we have localStorage but not PocketBase, migrate to PocketBase
    if (!userSettings?.master_salt && storedSalt && storedHash) {
      try {
        const settings = await saveUserSettings(user.id, storedSalt, storedHash);
        setUserSettings(settings);
      } catch (error) {
        console.error('Error migrating settings to PocketBase:', error);
      }
    }
    
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
      lastActivityRef.current = Date.now();
      return true;
    }
    
    return false;
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
