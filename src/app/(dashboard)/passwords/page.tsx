"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePasswords } from '@/hooks/usePasswords';
import { UnlockScreen } from '@/components/UnlockScreen';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { generatePassword } from '@/lib/encryption';
import { generateTOTPCode, getTOTPRemainingTime } from '@/lib/totp';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Key,
  Smartphone,
  Check,
} from 'lucide-react';
import type { Password, PasswordForm } from '@/types';

export default function PasswordsPage() {
  const { user, isLoading, isLocked } = useAuth();
  const { passwords, isLoading: passwordsLoading, addPassword, updatePassword, deletePassword } = usePasswords();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<Password | null>(null);
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [totpCodes, setTotpCodes] = useState<{ [key: string]: string }>({});
  const [totpTime, setTotpTime] = useState(30);

  // Form state
  const [formData, setFormData] = useState<PasswordForm>({
    name: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: '',
    totpSecret: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update TOTP codes every second
  useEffect(() => {
    const updateTotpCodes = () => {
      const codes: { [key: string]: string } = {};
      passwords.forEach((p) => {
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
  }, [passwords]);

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

  const filteredPasswords = passwords.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openDialog = (password?: Password) => {
    if (password) {
      setEditingPassword(password);
      setFormData({
        name: password.name,
        username: password.username,
        password: password.password,
        url: password.url || '',
        notes: password.notes || '',
        category: password.category || '',
        totpSecret: password.totpSecret || '',
      });
    } else {
      setEditingPassword(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        category: '',
        totpSecret: '',
      });
    }
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.username || !formData.password) {
      setFormError('Name, username, and password are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPassword) {
        await updatePassword(editingPassword.id, formData);
      } else {
        await addPassword(formData);
      }
      setIsDialogOpen(false);
    } catch (err) {
      setFormError('Failed to save password');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this password?')) {
      await deletePassword(id);
    }
  };

  const handleGeneratePassword = () => {
    setFormData((prev) => ({
      ...prev,
      password: generatePassword(20),
    }));
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Passwords</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your saved passwords and credentials
              </p>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Password
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search passwords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Password List */}
          {filteredPasswords.length === 0 ? (
            <Card className="p-8 text-center">
              <Key className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No passwords yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Add your first password to get started
              </p>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Password
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPasswords.map((password) => (
                <Card key={password.id} className="animate-fade-in">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {password.name}
                          </h3>
                          {password.category && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                              {password.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {password.username}
                        </p>
                        {password.url && (
                          <a
                            href={password.url.startsWith('http') ? password.url : `https://${password.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
                          >
                            {password.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      {/* Password field */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5">
                          <code className="text-sm font-mono">
                            {showPassword[password.id]
                              ? password.password
                              : '••••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              setShowPassword((prev) => ({
                                ...prev,
                                [password.id]: !prev[password.id],
                              }))
                            }
                          >
                            {showPassword[password.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopy(password.password, `pwd-${password.id}`)}
                          >
                            {copiedId === `pwd-${password.id}` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* TOTP Code */}
                      {password.totpSecret && totpCodes[password.id] && (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg px-3 py-1.5">
                              <Smartphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              <code className="text-lg font-mono font-bold text-amber-700 dark:text-amber-300">
                                {totpCodes[password.id]}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopy(totpCodes[password.id], `totp-${password.id}`)}
                              >
                                {copiedId === `totp-${password.id}` ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            {/* Timer bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
                                style={{ width: `${(totpTime / 30) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(password)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(password.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPassword ? 'Edit Password' : 'Add Password'}</DialogTitle>
            <DialogDescription>
              {editingPassword
                ? 'Update the password details below'
                : 'Fill in the details to save a new password'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., GitHub"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username / Email *</Label>
              <Input
                id="username"
                placeholder="your@email.com"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  required
                  className="font-mono"
                />
                <Button type="button" variant="outline" onClick={handleGeneratePassword}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Work, Personal, Finance"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totpSecret">TOTP Secret (for 2FA)</Label>
              <Input
                id="totpSecret"
                placeholder="Enter TOTP secret key"
                value={formData.totpSecret}
                onChange={(e) => setFormData((prev) => ({ ...prev, totpSecret: e.target.value }))}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Add a TOTP secret to generate 2FA codes for this account
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingPassword ? (
                  'Update'
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
