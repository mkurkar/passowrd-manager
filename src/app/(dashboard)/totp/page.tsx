"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePasswords } from '@/hooks/usePasswords';
import { UnlockScreen } from '@/components/UnlockScreen';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { generateTOTPCode, getTOTPRemainingTime, parseTOTPUri } from '@/lib/totp';
import {
  Loader2,
  Search,
  Copy,
  Smartphone,
  Check,
  Clock,
} from 'lucide-react';

export default function TOTPPage() {
  const { user, isLoading, isLocked } = useAuth();
  const { passwords, isLoading: passwordsLoading } = usePasswords();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [totpCodes, setTotpCodes] = useState<{ [key: string]: string }>({});
  const [totpTime, setTotpTime] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter passwords that have TOTP secrets
  const totpAccounts = passwords.filter((p) => p.totpSecret);

  // Update TOTP codes every second
  useEffect(() => {
    const updateTotpCodes = () => {
      const codes: { [key: string]: string } = {};
      totpAccounts.forEach((p) => {
        if (p.totpSecret) {
          try {
            codes[p.id] = generateTOTPCode(p.totpSecret);
          } catch {
            codes[p.id] = '------';
          }
        }
      });
      setTotpCodes(codes);
      setTotpTime(getTOTPRemainingTime());
    };

    updateTotpCodes();
    const interval = setInterval(updateTotpCodes, 1000);
    return () => clearInterval(interval);
  }, [totpAccounts]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || passwordsLoading) {
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

  const filteredAccounts = totpAccounts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculate the circumference for the circular progress
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totpTime / 30) * circumference;

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">TOTP Codes</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Time-based one-time passwords for your accounts
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Refreshes in {totpTime}s</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Info box */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Tip:</strong> To add TOTP codes, edit a password entry and add a TOTP secret key. 
              You can find this when setting up 2FA on a website - look for &quot;secret key&quot; or &quot;manual setup&quot;.
            </p>
          </div>

          {/* TOTP List */}
          {filteredAccounts.length === 0 ? (
            <Card className="p-8 text-center">
              <Smartphone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No TOTP codes yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Add TOTP secrets to your passwords to see codes here
              </p>
              <Button onClick={() => router.push('/passwords')}>
                Go to Passwords
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredAccounts.map((account) => (
                <Card key={account.id} className="animate-fade-in overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center p-4">
                      {/* Icon with timer */}
                      <div className="relative mr-4">
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-gray-200 dark:text-gray-700"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="none"
                            className="text-blue-500"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {totpTime}
                          </span>
                        </div>
                      </div>

                      {/* Account info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {account.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {account.username}
                        </p>
                      </div>

                      {/* TOTP Code */}
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <code className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100 tracking-wider">
                            {totpCodes[account.id]?.substring(0, 3)}
                            <span className="text-gray-400 mx-0.5"> </span>
                            {totpCodes[account.id]?.substring(3)}
                          </code>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => handleCopy(totpCodes[account.id], account.id)}
                        >
                          {copiedId === account.id ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${(totpTime / 30) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
