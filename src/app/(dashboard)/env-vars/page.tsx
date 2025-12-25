"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEnvVars } from '@/hooks/useEnvVars';
import { UnlockScreen } from '@/components/UnlockScreen';
import { Sidebar } from '@/components/Sidebar';
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Edit2,
  Trash2,
  Download,
  Variable,
  Check,
  FileCode,
  X,
} from 'lucide-react';
import type { EnvironmentVariable, EnvVarForm } from '@/types';

export default function EnvVarsPage() {
  const { user, isLoading, isLocked } = useAuth();
  const { envVars, isLoading: envVarsLoading, addEnvVar, updateEnvVar, deleteEnvVar, exportEnvFile } = useEnvVars();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEnv, setFilterEnv] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [editingEnvVar, setEditingEnvVar] = useState<EnvironmentVariable | null>(null);
  const [showValue, setShowValue] = useState<{ [key: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<EnvVarForm>({
    name: '',
    value: '',
    environment: 'development',
    project: '',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Export state
  const [exportEnv, setExportEnv] = useState<string>('development');
  const [exportedContent, setExportedContent] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || envVarsLoading) {
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

  const filteredEnvVars = envVars.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnv = filterEnv === 'all' || v.environment === filterEnv || v.environment === 'all';
    return matchesSearch && matchesEnv;
  });

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openDialog = (envVar?: EnvironmentVariable) => {
    if (envVar) {
      setEditingEnvVar(envVar);
      setFormData({
        name: envVar.name,
        value: envVar.value,
        environment: envVar.environment,
        project: envVar.project || '',
        description: envVar.description || '',
      });
    } else {
      setEditingEnvVar(null);
      setFormData({
        name: '',
        value: '',
        environment: 'development',
        project: '',
        description: '',
      });
    }
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.value) {
      setFormError('Name and value are required');
      return;
    }

    if (!/^[A-Z_][A-Z0-9_]*$/i.test(formData.name)) {
      setFormError('Name must start with a letter or underscore and contain only letters, numbers, and underscores');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingEnvVar) {
        await updateEnvVar(editingEnvVar.id, formData);
      } else {
        await addEnvVar(formData);
      }
      setIsDialogOpen(false);
    } catch (err) {
      setFormError('Failed to save environment variable');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this environment variable?')) {
      await deleteEnvVar(id);
    }
  };

  const handleExport = () => {
    const content = exportEnvFile(exportEnv);
    setExportedContent(content);
    setIsExportDialogOpen(true);
  };

  const handleDownloadEnvFile = () => {
    const content = exportEnvFile(exportEnv);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `.env.${exportEnv}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getEnvBadgeStyle = (env: string) => {
    switch (env) {
      case 'production':
        return 'bg-destructive/10 text-destructive border-destructive';
      case 'staging':
        return 'bg-amber-50 text-amber-700 border-amber-500';
      case 'development':
        return 'bg-primary/10 text-primary border-primary';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-500';
    }
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'development', label: 'Dev' },
    { id: 'staging', label: 'Stage' },
    { id: 'production', label: 'Prod' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground uppercase tracking-wide">Environment Variables</h1>
              <p className="text-sm text-muted-foreground">
                {filteredEnvVars.length} variable{filteredEnvVars.length !== 1 ? 's' : ''} stored
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold text-foreground uppercase tracking-wide border border-input bg-background hover:bg-muted transition-all"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={() => openDialog()}
                className="inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wide"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variable
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full border border-input bg-background pl-12 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            
            {/* Tabs */}
            <div className="flex border border-border bg-muted/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterEnv(tab.id)}
                  className={`px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-all ${
                    filterEnv === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Variable List */}
          {filteredEnvVars.length === 0 ? (
            <div className="bg-card border border-border shadow-sm p-8 sm:p-12 text-center">
              <div className="inline-flex p-4 bg-muted mb-4">
                <Variable className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 uppercase tracking-wide">
                No Variables Yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Add your first environment variable to start managing your configuration
              </p>
              <button
                onClick={() => openDialog()}
                className="inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 uppercase tracking-wide"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variable
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEnvVars.map((envVar) => (
                <div key={envVar.id} className="bg-card border border-border shadow-sm hover:border-primary/30 transition-colors animate-fade-in">
                  <div className="p-4 sm:p-5">
                    {/* Mobile Layout */}
                    <div className="lg:hidden space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <code className="font-mono font-bold text-foreground">
                              {envVar.name}
                            </code>
                            <span className={`px-2 py-0.5 text-xs border uppercase tracking-wider ${getEnvBadgeStyle(envVar.environment)}`}>
                              {envVar.environment}
                            </span>
                          </div>
                          {envVar.project && (
                            <span className="text-xs text-muted-foreground">
                              Project: {envVar.project}
                            </span>
                          )}
                          {envVar.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {envVar.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openDialog(envVar)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(envVar.id)}
                            className="p-2 text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Value Row */}
                      <div className="flex items-center gap-1 bg-muted border-2 border-border px-3 py-2">
                        <code className="text-sm font-mono flex-1 truncate text-foreground">
                          {showValue[envVar.id] ? envVar.value : '••••••••••••'}
                        </code>
                        <button
                          type="button"
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowValue((prev) => ({ ...prev, [envVar.id]: !prev[envVar.id] }))}
                        >
                          {showValue[envVar.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => handleCopy(envVar.value, envVar.id)}
                        >
                          {copiedId === envVar.id ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden lg:flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <code className="font-mono font-bold text-foreground">
                            {envVar.name}
                          </code>
                          <span className={`px-2 py-0.5 text-xs border uppercase tracking-wider ${getEnvBadgeStyle(envVar.environment)}`}>
                            {envVar.environment}
                          </span>
                          {envVar.project && (
                            <span className="px-2 py-0.5 text-xs bg-muted border border-border text-muted-foreground">
                              {envVar.project}
                            </span>
                          )}
                        </div>
                        {envVar.description && (
                          <p className="text-sm text-muted-foreground">
                            {envVar.description}
                          </p>
                        )}
                      </div>

                      {/* Value field */}
                      <div className="flex items-center gap-1 bg-muted border-2 border-border px-3 py-2 max-w-sm">
                        <code className="text-sm font-mono truncate min-w-[120px] text-foreground">
                          {showValue[envVar.id] ? envVar.value : '••••••••••••'}
                        </code>
                        <button
                          type="button"
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowValue((prev) => ({ ...prev, [envVar.id]: !prev[envVar.id] }))}
                        >
                          {showValue[envVar.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => handleCopy(envVar.value, envVar.id)}
                        >
                          {copiedId === envVar.id ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openDialog(envVar)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(envVar.id)}
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
          <div className="w-full max-w-md bg-card border border-border shadow-elegant animate-fade-in">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">
                  {editingEnvVar ? 'Edit Variable' : 'Add Variable'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {editingEnvVar ? 'Update the environment variable below' : 'Fill in the details to save a new environment variable'}
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
                  placeholder="e.g., DATABASE_URL"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value.toUpperCase() }))}
                  required
                  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground font-mono placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="value" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Value *
                </label>
                <textarea
                  id="value"
                  placeholder="Enter the value..."
                  value={formData.value}
                  onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                  rows={3}
                  required
                  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground font-mono placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="environment" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Environment *
                </label>
                <select
                  id="environment"
                  value={formData.environment}
                  onChange={(e) => setFormData((prev) => ({ ...prev, environment: e.target.value as EnvVarForm['environment'] }))}
                  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                  <option value="all">All Environments</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="project" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Project (optional)
                </label>
                <input
                  id="project"
                  type="text"
                  placeholder="e.g., my-app"
                  value={formData.project}
                  onChange={(e) => setFormData((prev) => ({ ...prev, project: e.target.value }))}
                  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Description (optional)
                </label>
                <input
                  id="description"
                  type="text"
                  placeholder="What is this variable for?"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
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
                  ) : editingEnvVar ? (
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

      {/* Export Dialog */}
      {isExportDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-card border border-border shadow-elegant animate-fade-in">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-bold text-foreground uppercase tracking-wide">
                  Export Environment File
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select an environment and export as a .env file
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExportDialogOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label htmlFor="exportEnv" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Environment
                </label>
                <select
                  id="exportEnv"
                  value={exportEnv}
                  onChange={(e) => {
                    setExportEnv(e.target.value);
                    setExportedContent(exportEnvFile(e.target.value));
                  }}
                  className="block w-full border border-input bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Preview
                </label>
                <pre className="p-4 bg-muted border-2 border-border text-sm font-mono overflow-auto max-h-64 text-foreground">
                  {exportedContent || 'No variables for this environment'}
                </pre>
              </div>

              {/* Dialog Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsExportDialogOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-foreground uppercase tracking-wide border border-input bg-background hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDownloadEnvFile}
                  disabled={!exportedContent}
                  className="flex-1 inline-flex items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wide"
                >
                  <FileCode className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
