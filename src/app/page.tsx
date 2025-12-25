"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UnlockScreen } from '@/components/UnlockScreen';
import { Sidebar } from '@/components/Sidebar';
import { Loader2, Shield, Key, Terminal, Smartphone } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isLocked) {
    return <UnlockScreen />;
  }

  const features = [
    {
      icon: Key,
      title: 'Passwords',
      description: 'Securely store and manage your passwords with AES-256 encryption',
      href: '/passwords',
    },
    {
      icon: Terminal,
      title: 'Environment Variables',
      description: 'Manage API keys, tokens, and secrets for your projects',
      href: '/env-vars',
    },
    {
      icon: Smartphone,
      title: 'TOTP Codes',
      description: 'Generate time-based one-time passwords for 2FA',
      href: '/totp',
    },
  ];

  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900 uppercase">
                SecureVault
              </h1>
            </div>
            <p className="text-gray-500">
              Your secure password and environment variable manager
            </p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <button
                key={feature.title}
                type="button"
                className="bg-white border-2 border-gray-200 hover:border-primary/50 transition-colors cursor-pointer group text-left p-6"
                onClick={() => router.push(feature.href)}
              >
                <feature.icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <h2 className="font-bold uppercase tracking-wide text-gray-900 mb-2">
                  {feature.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {feature.description}
                </p>
              </button>
            ))}
          </div>

          {/* Security Info */}
          <div className="mt-8 p-6 bg-primary/5 border-2 border-primary/20">
            <h3 className="font-bold uppercase tracking-wide text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Security Features
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• AES-256 client-side encryption</li>
              <li>• PBKDF2 key derivation with 100,000 iterations</li>
              <li>• Auto-lock after 5 minutes of inactivity</li>
              <li>• Zero-knowledge architecture - your data is encrypted before it leaves your device</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
