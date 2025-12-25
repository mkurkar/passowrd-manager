"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbase';
import { deriveKey, generateSalt, hashPassword } from '@/lib/encryption';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  encryptionKey: string | null;
  isLoading: boolean;
  isLocked: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  unlock: (masterPassword: string) => boolean;
  lock: () => void;
  setMasterPassword: (password: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [masterPasswordHash, setMasterPasswordHash] = useState<string | null>(null);
  const [masterPasswordSalt, setMasterPasswordSalt] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Auto-lock after inactivity
  useEffect(() => {
    if (!user || !encryptionKey) return;

    const checkInactivity = () => {
      if (Date.now() - lastActivity > LOCK_TIMEOUT) {
        lock();
      }
    };

    const interval = setInterval(checkInactivity, 10000);
    
    const updateActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, [user, encryptionKey, lastActivity]);

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
        setIsLocked(true); // Require master password unlock
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const authData = await pb.collection('users').authWithPassword(email, password);
    setUser({
      id: authData.record.id,
      email: authData.record.email,
      name: authData.record.name || '',
      created: authData.record.created,
      updated: authData.record.updated,
    });
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

  const logout = useCallback(() => {
    pb.authStore.clear();
    setUser(null);
    setEncryptionKey(null);
    setMasterPasswordHash(null);
    setMasterPasswordSalt(null);
    setIsLocked(false);
  }, []);

  const setMasterPassword = (password: string) => {
    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    const key = deriveKey(password, salt);
    
    setMasterPasswordSalt(salt);
    setMasterPasswordHash(hash);
    setEncryptionKey(key);
    setIsLocked(false);
    setLastActivity(Date.now());
    
    // Store salt in localStorage (hash is for verification, salt is needed to derive key)
    localStorage.setItem(`masterSalt_${user?.id}`, salt);
    localStorage.setItem(`masterHash_${user?.id}`, hash);
  };

  const unlock = (password: string): boolean => {
    const storedSalt = localStorage.getItem(`masterSalt_${user?.id}`);
    const storedHash = localStorage.getItem(`masterHash_${user?.id}`);
    
    if (!storedSalt || !storedHash) {
      // First time - set the master password
      setMasterPassword(password);
      return true;
    }
    
    const hash = hashPassword(password, storedSalt);
    if (hash === storedHash) {
      const key = deriveKey(password, storedSalt);
      setEncryptionKey(key);
      setMasterPasswordHash(storedHash);
      setMasterPasswordSalt(storedSalt);
      setIsLocked(false);
      setLastActivity(Date.now());
      return true;
    }
    
    return false;
  };

  const lock = useCallback(() => {
    setEncryptionKey(null);
    setIsLocked(true);
  }, []);

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
