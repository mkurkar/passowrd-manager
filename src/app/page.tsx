"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UnlockScreen } from '@/components/UnlockScreen';
import { Sidebar } from '@/components/Sidebar';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, isLoading, isLocked } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && !isLocked) {
      router.push('/passwords');
    }
  }, [user, isLoading, isLocked, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isLocked) {
    return <UnlockScreen />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Welcome to SecureVault
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select a category from the sidebar to manage your passwords, environment variables, or TOTP codes.
          </p>
        </div>
      </main>
    </div>
  );
}
