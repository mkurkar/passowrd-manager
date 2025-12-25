"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEnvVars } from '@/hooks/useEnvVars';
import { UnlockScreen } from '@/components/UnlockScreen';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
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
} from 'lucide-react';
import type { EnvironmentVariable, EnvVarForm } from '@/types';

const environments = ['all', 'development', 'staging', 'production'] as const;

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

    // Validate env var name format
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

  const getEnvBadgeColor = (env: string) => {
    switch (env) {
      case 'production':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'staging':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'development':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Environment Variables</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage your environment variables securely
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export .env
              </Button>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variable
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search variables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={filterEnv} onValueChange={setFilterEnv}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="development">Dev</TabsTrigger>
                <TabsTrigger value="staging">Staging</TabsTrigger>
                <TabsTrigger value="production">Prod</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Variable List */}
          {filteredEnvVars.length === 0 ? (
            <Card className="p-8 text-center">
              <Variable className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No environment variables yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Add your first environment variable to get started
              </p>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variable
              </Button>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredEnvVars.map((envVar) => (
                <Card key={envVar.id} className="animate-fade-in">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="font-mono font-medium text-gray-900 dark:text-gray-100">
                            {envVar.name}
                          </code>
                          <span className={`px-2 py-0.5 text-xs rounded ${getEnvBadgeColor(envVar.environment)}`}>
                            {envVar.environment}
                          </span>
                          {envVar.project && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                              {envVar.project}
                            </span>
                          )}
                        </div>
                        {envVar.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {envVar.description}
                          </p>
                        )}
                      </div>

                      {/* Value field */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5 max-w-xs">
                          <code className="text-sm font-mono truncate">
                            {showValue[envVar.id] ? envVar.value : '••••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() =>
                              setShowValue((prev) => ({
                                ...prev,
                                [envVar.id]: !prev[envVar.id],
                              }))
                            }
                          >
                            {showValue[envVar.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => handleCopy(envVar.value, envVar.id)}
                          >
                            {copiedId === envVar.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(envVar)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(envVar.id)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEnvVar ? 'Edit Variable' : 'Add Variable'}</DialogTitle>
            <DialogDescription>
              {editingEnvVar
                ? 'Update the environment variable below'
                : 'Fill in the details to save a new environment variable'}
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
                placeholder="e.g., DATABASE_URL"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value.toUpperCase() }))}
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value *</Label>
              <Textarea
                id="value"
                placeholder="Enter the value..."
                value={formData.value}
                onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                className="font-mono"
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment">Environment *</Label>
              <Select
                id="environment"
                value={formData.environment}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    environment: e.target.value as EnvVarForm['environment'],
                  }))
                }
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
                <option value="all">All Environments</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project (optional)</Label>
              <Input
                id="project"
                placeholder="e.g., my-app"
                value={formData.project}
                onChange={(e) => setFormData((prev) => ({ ...prev, project: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="What is this variable for?"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
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
                ) : editingEnvVar ? (
                  'Update'
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Export Environment File</DialogTitle>
            <DialogDescription>
              Select an environment and export as a .env file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exportEnv">Environment</Label>
              <Select
                id="exportEnv"
                value={exportEnv}
                onChange={(e) => {
                  setExportEnv(e.target.value);
                  setExportedContent(exportEnvFile(e.target.value));
                }}
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preview</Label>
              <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono overflow-auto max-h-64">
                {exportedContent || 'No variables for this environment'}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDownloadEnvFile} disabled={!exportedContent}>
              <FileCode className="h-4 w-4 mr-2" />
              Download .env.{exportEnv}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
