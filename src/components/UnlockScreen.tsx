"use client"

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Loader2, LogOut } from 'lucide-react';

export function UnlockScreen() {
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { unlock, logout, user } = useAuth();

  const isFirstTime = !localStorage.getItem(`masterSalt_${user?.id}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (masterPassword.length < 8) {
        setError('Master password must be at least 8 characters');
        return;
      }

      const success = unlock(masterPassword);
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-500 rounded-xl">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {isFirstTime ? 'Set Master Password' : 'Unlock Vault'}
          </CardTitle>
          <CardDescription>
            {isFirstTime
              ? 'Create a master password to encrypt your data. This password is never stored and cannot be recovered.'
              : 'Enter your master password to access your vault'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                {error}
              </div>
            )}
            {isFirstTime && (
              <div className="p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
                <strong>Important:</strong> Your master password cannot be recovered if forgotten. 
                All your encrypted data will be permanently inaccessible.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="masterPassword">Master Password</Label>
              <Input
                id="masterPassword"
                type="password"
                placeholder={isFirstTime ? 'Create a strong master password' : 'Enter your master password'}
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                required
                autoComplete={isFirstTime ? 'new-password' : 'current-password'}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isFirstTime ? 'Setting up...' : 'Unlocking...'}
                  </>
                ) : (
                  isFirstTime ? 'Set Password' : 'Unlock'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
