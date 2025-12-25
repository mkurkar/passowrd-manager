"use client"

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePasswords } from '@/hooks/usePasswords';
import { UnlockScreen } from '@/components/UnlockScreen';
import { Sidebar } from '@/components/Sidebar';
import { generateTOTPCode, getTOTPRemainingTime } from '@/lib/totp';
import {
  Search,
  Copy,
  Smartphone,
  Check,
  Clock,
  Shield,
} from 'lucide-react';

export default function TOTPPage() {
  const { user, isLoading, isLocked } = useAuth();
  const { passwords, isLoading: passwordsLoading } = usePasswords();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [totpCodes, setTotpCodes] = useState<{ [key: string]: string }>({});
  const [totpTime, setTotpTime] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter passwords that have TOTP secrets - memoize to prevent infinite loop
  const totpAccounts = useMemo(() => passwords.filter((p) => p.totpSecret), [passwords]);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
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
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground uppercase flex items-center gap-2">
                <Shield className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                TOTP Codes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Time-based one-time passwords for your accounts
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted border border-border">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-medium text-foreground">
                REFRESH: {totpTime}s
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full border border-input bg-background pl-12 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Info box */}
          <div className="mb-6 p-4 bg-primary/5 border-2 border-primary/20">
            <p className="text-sm text-foreground">
              <strong className="uppercase tracking-wide">Tip:</strong> To add TOTP codes, edit a password entry and add a TOTP secret key.
              You can find this when setting up 2FA on a website - look for &quot;secret key&quot; or &quot;manual setup&quot;.
            </p>
          </div>

          {/* TOTP List */}
          {filteredAccounts.length === 0 ? (
            <div className="bg-card border-2 border-border p-8 text-center">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold uppercase tracking-wide text-foreground mb-2">
                No TOTP codes yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Add TOTP secrets to your passwords to see codes here
              </p>
              <button
                onClick={() => router.push('/passwords')}
                className="inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 uppercase tracking-wide"
              >
                Go to Passwords
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredAccounts.map((account) => (
                <div key={account.id} className="bg-card border-2 border-border hover:border-primary/50 transition-colors animate-fade-in overflow-hidden">
                  <div className="flex items-center p-4">
                    {/* Icon with timer */}
                    <div className="relative mr-4 hidden sm:block">
                      <svg className="w-12 h-12 transform -rotate-90">
                        <circle
                          cx="24"
                          cy="24"
                          r={radius}
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="24"
                          cy="24"
                          r={radius}
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          className="text-primary"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="square"
                          style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-mono font-bold text-foreground">
                          {totpTime}
                        </span>
                      </div>
                    </div>

                    {/* Account info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground truncate uppercase tracking-wide text-sm">
                        {account.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {account.username}
                      </p>
                    </div>

                    {/* TOTP Code */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <code className="text-xl lg:text-2xl font-mono font-bold text-foreground tracking-widest">
                          {totpCodes[account.id]?.substring(0, 3)}
                          <span className="text-muted-foreground mx-1">-</span>
                          {totpCodes[account.id]?.substring(3)}
                        </code>
                      </div>
                      <button
                        type="button"
                        className="p-2 border-2 border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        onClick={() => handleCopy(totpCodes[account.id], account.id)}
                      >
                        {copiedId === account.id ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-muted">
                    <div
                      className="h-full bg-primary transition-all duration-1000 ease-linear"
                      style={{ width: `${(totpTime / 30) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mobile timer display */}
          <div className="sm:hidden fixed bottom-4 left-4 right-4 bg-card border-2 border-border p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-bold uppercase">Time Remaining</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-1000 ease-linear"
                  style={{ width: `${(totpTime / 30) * 100}%` }}
                />
              </div>
              <span className="font-mono font-bold text-foreground w-6 text-right">{totpTime}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
