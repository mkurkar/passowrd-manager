"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePasswords } from '@/hooks/usePasswords';
import { parsePasswordCSV, detectColumnMappings } from '@/hooks/usePasswords';
import type { ParsedPassword, CSVColumnMapping, ImportResult } from '@/hooks/usePasswords';
import { UnlockScreen } from '@/components/UnlockScreen';
import { Sidebar } from '@/components/Sidebar';
import { generatePassword } from '@/lib/encryption';
import { generateTOTPCode, getTOTPRemainingTime } from '@/lib/totp';
import {
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
  X,
  Upload,
  FileText,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import type { Password, PasswordForm } from '@/types';

export default function PasswordsPage() {
  const { user, isLoading, isLocked } = useAuth();
  const { passwords, isLoading: passwordsLoading, addPassword, updatePassword, deletePassword, importPasswords, getCategories } = usePasswords();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
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

  // Import dialog state
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview' | 'result'>('upload');
  const [importFileContent, setImportFileContent] = useState('');
  const [parsedPasswords, setParsedPasswords] = useState<ParsedPassword[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<CSVColumnMapping[]>([]);
  const [importOptions, setImportOptions] = useState({ skipExisting: true, defaultCategory: '' });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground uppercase tracking-wide">Passwords</h1>
              <p className="text-sm text-muted-foreground">
                {filteredPasswords.length} credential{filteredPasswords.length !== 1 ? 's' : ''} stored
              </p>
            </div>
            <button
              onClick={() => openDialog()}
              className="inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wide"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Password
            </button>
            <button
              onClick={() => {
                setImportStep('upload');
                setImportFileContent('');
                setParsedPasswords([]);
                setCsvHeaders([]);
                setColumnMappings([]);
                setImportResult(null);
                setIsImportDialogOpen(true);
              }}
              className="inline-flex items-center justify-center border border-input bg-background px-4 py-2.5 text-sm font-bold text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wide"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, username, or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full border border-input bg-background pl-12 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Password List */}
          {filteredPasswords.length === 0 ? (
            <div className="bg-card border border-border shadow-sm p-8 sm:p-12 text-center">
              <div className="inline-flex p-4 bg-muted mb-4">
                <Key className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 uppercase tracking-wide">
                No Passwords Yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Add your first password to start securely managing your credentials
              </p>
              <button
                onClick={() => openDialog()}
                className="inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 uppercase tracking-wide"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Password
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPasswords.map((password) => (
                <div key={password.id} className="bg-card border border-border shadow-sm hover:border-primary/30 transition-colors animate-fade-in">
                  <div className="p-4 sm:p-5">
                    {/* Mobile Layout */}
                    <div className="lg:hidden space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-foreground uppercase tracking-wide">
                              {password.name}
                            </h3>
                            {password.category && (
                              <span className="px-2 py-0.5 text-xs bg-muted border border-border text-muted-foreground uppercase tracking-wider">
                                {password.category}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {password.username}
                          </p>
                          {password.url && (
                            <a
                              href={password.url.startsWith('http') ? password.url : `https://${password.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                            >
                              {password.url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openDialog(password)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(password.id)}
                            className="p-2 text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Password & TOTP Row */}
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1 bg-muted border-2 border-border px-3 py-2 flex-1 min-w-[200px]">
                          <code className="text-sm font-mono flex-1 truncate text-foreground">
                            {showPassword[password.id] ? password.password : '••••••••••••'}
                          </code>
                          <button
                            type="button"
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword((prev) => ({ ...prev, [password.id]: !prev[password.id] }))}
                          >
                            {showPassword[password.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => handleCopy(password.password, `pwd-${password.id}`)}
                          >
                            {copiedId === `pwd-${password.id}` ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>

                        {password.totpSecret && totpCodes[password.id] && (
                          <div className="flex items-center gap-2 bg-primary/5 border-2 border-primary px-3 py-2">
                            <Smartphone className="h-4 w-4 text-primary" />
                            <code className="text-lg font-mono font-bold text-primary">
                              {totpCodes[password.id]}
                            </code>
                            <button
                              type="button"
                              className="p-1.5 text-primary hover:text-primary/80 transition-colors"
                              onClick={() => handleCopy(totpCodes[password.id], `totp-${password.id}`)}
                            >
                              {copiedId === `totp-${password.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                            <div className="w-8 h-1 bg-primary/30">
                              <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(totpTime / 30) * 100}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-foreground uppercase tracking-wide">
                            {password.name}
                          </h3>
                          {password.category && (
                            <span className="px-2 py-0.5 text-xs bg-muted border border-border text-muted-foreground uppercase tracking-wider">
                              {password.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">{password.username}</span>
                          {password.url && (
                            <a
                              href={password.url.startsWith('http') ? password.url : `https://${password.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {password.url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Password field */}
                      <div className="flex items-center gap-1 bg-muted border-2 border-border px-3 py-2">
                        <code className="text-sm font-mono min-w-[120px] text-foreground">
                          {showPassword[password.id] ? password.password : '••••••••••••'}
                        </code>
                        <button
                          type="button"
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowPassword((prev) => ({ ...prev, [password.id]: !prev[password.id] }))}
                        >
                          {showPassword[password.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => handleCopy(password.password, `pwd-${password.id}`)}
                        >
                          {copiedId === `pwd-${password.id}` ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* TOTP Code */}
                      {password.totpSecret && totpCodes[password.id] && (
                        <div className="flex items-center gap-2 bg-primary/5 border-2 border-primary px-3 py-2">
                          <Smartphone className="h-4 w-4 text-primary" />
                          <code className="text-lg font-mono font-bold text-primary">
                            {totpCodes[password.id]}
                          </code>
                          <button
                            type="button"
                            className="p-1.5 text-primary hover:text-primary/80 transition-colors"
                            onClick={() => handleCopy(totpCodes[password.id], `totp-${password.id}`)}
                          >
                            {copiedId === `totp-${password.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                          <div className="w-8 h-1 bg-primary/30">
                            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(totpTime / 30) * 100}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openDialog(password)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(password.id)}
                          className="p-2 text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border shadow-elegant max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">
                  {editingPassword ? 'Edit Password' : 'Add Password'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {editingPassword ? 'Update the password details below' : 'Fill in the details to save a new password'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dialog Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-4 text-sm text-destructive bg-destructive/10 border-2 border-destructive flex items-center gap-2">
                  <div className="w-2 h-2 bg-destructive flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g., GitHub"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="username" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Username / Email *
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="your@email.com"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  required
                  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Password *
                </label>
                <div className="flex gap-2">
                  <input
                    id="password"
                    type="text"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    required
                    className="block w-full border border-input bg-background px-4 py-2.5 text-foreground font-mono placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-3 py-2.5 border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    title="Generate password"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="url" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Website URL
                </label>
                <input
                  id="url"
                  type="text"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Category
                </label>
                <input
                  id="category"
                  type="text"
                  placeholder="e.g., Work, Personal, Finance"
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="totpSecret" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  TOTP Secret (for 2FA)
                </label>
                <input
                  id="totpSecret"
                  type="text"
                  placeholder="Enter TOTP secret key"
                  value={formData.totpSecret}
                  onChange={(e) => setFormData((prev) => ({ ...prev, totpSecret: e.target.value }))}
                  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground font-mono placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
                <p className="text-xs text-muted-foreground">
                  Add a TOTP secret to generate 2FA codes for this account
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Notes
                </label>
                <textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>

              {/* Dialog Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-foreground uppercase tracking-wide border border-input bg-background hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wide"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : editingPassword ? (
                    'Update'
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {isImportDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-card border border-border shadow-elegant max-h-[90vh] overflow-hidden animate-fade-in flex flex-col">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">
                  Import Passwords
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {importStep === 'upload' && 'Upload a CSV file from your password manager'}
                  {importStep === 'mapping' && 'Map CSV columns to password fields'}
                  {importStep === 'preview' && 'Review passwords before importing'}
                  {importStep === 'result' && 'Import complete'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportDialogOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Step 1: Upload */}
              {importStep === 'upload' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border p-8 text-center hover:border-primary/50 transition-colors">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop a CSV file, or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const content = event.target?.result as string;
                            setImportFileContent(content);
                            const { passwords, headers, mappings } = parsePasswordCSV(content);
                            setParsedPasswords(passwords);
                            setCsvHeaders(headers);
                            setColumnMappings(mappings);
                            setImportStep('mapping');
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className="hidden"
                      id="csv-file-input"
                    />
                    <label
                      htmlFor="csv-file-input"
                      className="inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 cursor-pointer transition-all duration-200 uppercase tracking-wide"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select CSV File
                    </label>
                  </div>
                  
                  <div className="p-4 bg-muted border border-border">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Supported Formats
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Most password managers export to CSV format including: Chrome, Firefox, Bitwarden, 1Password, LastPass, KeePass, and others.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Column Mapping */}
              {importStep === 'mapping' && (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 border-2 border-primary/20">
                    <p className="text-sm text-foreground">
                      <strong className="uppercase tracking-wide">Auto-detected columns:</strong> We&apos;ve tried to map your CSV columns. Adjust if needed.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {columnMappings.map((mapping, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <code className="text-sm bg-muted px-2 py-1 border border-border text-foreground truncate block">
                            {mapping.csvColumn}
                          </code>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 rotate-[-90deg]" />
                        <div className="flex-1">
                          <select
                            value={mapping.mappedTo || ''}
                            onChange={(e) => {
                              const newMappings = [...columnMappings];
                              newMappings[index] = {
                                ...mapping,
                                mappedTo: (e.target.value || null) as keyof PasswordForm | null,
                              };
                              setColumnMappings(newMappings);
                            }}
                            className="block w-full border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="">-- Skip --</option>
                            <option value="name">Name</option>
                            <option value="username">Username</option>
                            <option value="password">Password</option>
                            <option value="url">URL</option>
                            <option value="notes">Notes</option>
                            <option value="category">Category</option>
                            <option value="totpSecret">TOTP Secret</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Required fields check */}
                  <div className="p-4 bg-muted border border-border">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Required Mappings
                    </h4>
                    <div className="flex gap-4 text-sm">
                      <span className={columnMappings.some(m => m.mappedTo === 'name') ? 'text-primary' : 'text-destructive'}>
                        {columnMappings.some(m => m.mappedTo === 'name') ? <Check className="inline h-4 w-4" /> : <X className="inline h-4 w-4" />} Name
                      </span>
                      <span className={columnMappings.some(m => m.mappedTo === 'username') ? 'text-primary' : 'text-destructive'}>
                        {columnMappings.some(m => m.mappedTo === 'username') ? <Check className="inline h-4 w-4" /> : <X className="inline h-4 w-4" />} Username
                      </span>
                      <span className={columnMappings.some(m => m.mappedTo === 'password') ? 'text-primary' : 'text-destructive'}>
                        {columnMappings.some(m => m.mappedTo === 'password') ? <Check className="inline h-4 w-4" /> : <X className="inline h-4 w-4" />} Password
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Preview */}
              {importStep === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                        {parsedPasswords.filter(p => p.name && p.username && p.password).length} passwords to import
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {parsedPasswords.filter(p => !p.name || !p.username || !p.password).length} will be skipped (missing required fields)
                      </p>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="p-4 bg-muted border border-border space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={importOptions.skipExisting}
                        onChange={(e) => setImportOptions(prev => ({ ...prev, skipExisting: e.target.checked }))}
                        className="w-4 h-4 border-2 border-input bg-background checked:bg-primary checked:border-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">Skip existing passwords (same name + username)</span>
                    </label>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Default Category (for entries without one)
                      </label>
                      <input
                        type="text"
                        value={importOptions.defaultCategory}
                        onChange={(e) => setImportOptions(prev => ({ ...prev, defaultCategory: e.target.value }))}
                        placeholder="e.g., Imported"
                        className="block w-full border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Preview list */}
                  <div className="border border-border max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                          <th className="text-left p-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Username</th>
                          <th className="text-left p-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">URL</th>
                          <th className="text-left p-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPasswords.slice(0, 50).map((p, i) => {
                          const isValid = p.name && p.username && p.password;
                          return (
                            <tr key={i} className={`border-t border-border ${!isValid ? 'opacity-50' : ''}`}>
                              <td className="p-2 truncate max-w-[150px]">{p.name || '-'}</td>
                              <td className="p-2 truncate max-w-[150px]">{p.username || '-'}</td>
                              <td className="p-2 truncate max-w-[150px]">{p.url || '-'}</td>
                              <td className="p-2">
                                {isValid ? (
                                  <span className="text-xs text-primary font-medium">Ready</span>
                                ) : (
                                  <span className="text-xs text-destructive font-medium">Skip</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {parsedPasswords.length > 50 && (
                      <div className="p-2 text-center text-sm text-muted-foreground bg-muted">
                        ... and {parsedPasswords.length - 50} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Result */}
              {importStep === 'result' && importResult && (
                <div className="space-y-4">
                  <div className={`p-6 text-center ${importResult.imported > 0 ? 'bg-primary/5 border-2 border-primary' : 'bg-muted border-2 border-border'}`}>
                    <div className="text-4xl font-bold text-primary mb-2">{importResult.imported}</div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide">
                      Passwords Imported
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted border border-border text-center">
                      <div className="text-2xl font-bold text-foreground">{importResult.skipped}</div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Skipped</p>
                    </div>
                    <div className="p-4 bg-muted border border-border text-center">
                      <div className="text-2xl font-bold text-foreground">{importResult.errors.length}</div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Errors</p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="p-4 bg-destructive/10 border-2 border-destructive">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-destructive uppercase tracking-wide mb-2">Errors</h4>
                          <ul className="text-sm text-destructive space-y-1">
                            {importResult.errors.slice(0, 5).map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                            {importResult.errors.length > 5 && (
                              <li>... and {importResult.errors.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="flex gap-3 p-6 border-t border-border flex-shrink-0">
              {importStep === 'upload' && (
                <button
                  type="button"
                  onClick={() => setIsImportDialogOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-foreground uppercase tracking-wide border border-input bg-background hover:bg-muted transition-all"
                >
                  Cancel
                </button>
              )}

              {importStep === 'mapping' && (
                <>
                  <button
                    type="button"
                    onClick={() => setImportStep('upload')}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-foreground uppercase tracking-wide border border-input bg-background hover:bg-muted transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Re-parse with updated mappings
                      const { passwords } = parsePasswordCSV(importFileContent, columnMappings);
                      setParsedPasswords(passwords);
                      setImportStep('preview');
                    }}
                    disabled={!columnMappings.some(m => m.mappedTo === 'name') || !columnMappings.some(m => m.mappedTo === 'username') || !columnMappings.some(m => m.mappedTo === 'password')}
                    className="flex-1 inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wide"
                  >
                    Continue
                  </button>
                </>
              )}

              {importStep === 'preview' && (
                <>
                  <button
                    type="button"
                    onClick={() => setImportStep('mapping')}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-foreground uppercase tracking-wide border border-input bg-background hover:bg-muted transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsImporting(true);
                      try {
                        const validPasswords = parsedPasswords.filter(p => p.name && p.username && p.password);
                        const result = await importPasswords(validPasswords, importOptions);
                        setImportResult(result);
                        setImportStep('result');
                      } catch (err) {
                        console.error('Import failed:', err);
                        setImportResult({
                          imported: 0,
                          skipped: 0,
                          errors: [err instanceof Error ? err.message : 'Import failed'],
                        });
                        setImportStep('result');
                      } finally {
                        setIsImporting(false);
                      }
                    }}
                    disabled={isImporting || parsedPasswords.filter(p => p.name && p.username && p.password).length === 0}
                    className="flex-1 inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wide"
                  >
                    {isImporting ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Importing...
                      </>
                    ) : (
                      `Import ${parsedPasswords.filter(p => p.name && p.username && p.password).length} Passwords`
                    )}
                  </button>
                </>
              )}

              {importStep === 'result' && (
                <button
                  type="button"
                  onClick={() => setIsImportDialogOpen(false)}
                  className="flex-1 inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all duration-200 uppercase tracking-wide"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
