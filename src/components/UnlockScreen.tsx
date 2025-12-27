"use client"

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Loader2, LogOut, AlertTriangle, Shield, KeyRound, ArrowRight } from 'lucide-react';

export function UnlockScreen() {
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { unlock, logout, user } = useAuth();

  const isFirstTime = typeof window !== 'undefined' && !localStorage.getItem(`masterSalt_${user?.id}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (masterPassword.length < 8) {
        setError('Master password must be at least 8 characters');
        return;
      }

      const success = await unlock(masterPassword);
      if (!success) {
        setError('Invalid master password');
      }
    } catch (err) {
      setError('Failed to unlock vault');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 sm:p-10 bg-gray-100">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex p-5 bg-primary mb-6">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide mb-4">
            SecureVault
          </h1>
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-white border-2 border-gray-200">
            <div className="w-2 h-2 bg-primary" />
            <span className="text-sm text-gray-500">{user?.email}</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-gray-200 shadow-xl animate-fade-in">
          {/* Card Header */}
          <div className="p-8 pb-6 text-center border-b-2 border-gray-100">
            <div className="inline-flex p-5 bg-primary/10 border-2 border-primary/20 mb-6">
              {isFirstTime ? (
                <KeyRound className="w-10 h-10 text-primary" />
              ) : (
                <Lock className="w-10 h-10 text-primary" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-2">
              {isFirstTime ? 'Set Master Password' : 'Vault Locked'}
            </h2>
            <p className="text-gray-500">
              {isFirstTime
                ? 'Create a master password to encrypt your data'
                : 'Enter your master password to unlock'}
            </p>
          </div>

          {/* Card Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-4 p-4 bg-error-light border-2 border-error/30 text-error">
                  <div className="w-2 h-2 bg-error flex-shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Warning for first time */}
              {isFirstTime && (
                <div className="flex gap-4 p-5 bg-warning-light border-2 border-warning/30">
                  <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
                  <div className="text-sm text-warning">
                    <strong className="block font-bold uppercase tracking-wide mb-1">Important</strong>
                    Your master password cannot be recovered if forgotten. All your encrypted data will be permanently inaccessible.
                  </div>
                </div>
              )}

              {/* Master Password Field */}
              <div className="space-y-3">
                <label 
                  htmlFor="masterPassword" 
                  className="flex items-center gap-3 text-sm font-semibold text-gray-700 uppercase tracking-wide"
                >
                  <Lock className="w-4 h-4 text-gray-400" />
                  Master Password
                </label>
                <input
                  id="masterPassword"
                  type="password"
                  placeholder={isFirstTime ? 'Create a strong password (min 8 chars)' : 'Enter your master password'}
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  required
                  autoComplete={isFirstTime ? 'new-password' : 'current-password'}
                  autoFocus
                  className="w-full h-14 px-5 text-base text-gray-900 placeholder-gray-400 bg-white border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-14 flex items-center justify-center gap-3 bg-primary text-white text-base font-bold uppercase tracking-wide border-2 border-primary hover:bg-primary-dark hover:border-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isFirstTime ? 'Setting Up...' : 'Unlocking...'}
                    </>
                  ) : (
                    <>
                      {isFirstTime ? 'Set Password' : 'Unlock'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="h-14 px-5 flex items-center justify-center bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Security Badge */}
        <div className="mt-10 p-5 bg-white border-2 border-gray-200">
          <div className="flex items-center justify-center gap-8 text-xs text-gray-400 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary" />
              <span>AES-256</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary" />
              <span>PBKDF2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary" />
              <span>100K Iterations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
