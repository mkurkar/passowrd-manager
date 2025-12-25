"use client"

import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbase';
import { encrypt, decrypt } from '@/lib/encryption';
import { useAuth } from './useAuth';
import type { EnvironmentVariable, EnvVarForm } from '@/types';

export function useEnvVars() {
  const { user, encryptionKey } = useAuth();
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvVars = useCallback(async () => {
    if (!user || !encryptionKey) {
      setEnvVars([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const records = await pb.collection('env_vars').getFullList({
        filter: `user = "${user.id}"`,
        sort: '-created',
      });

      const decryptedEnvVars = records.map((record) => ({
        id: record.id,
        user: record.user,
        name: record.name,
        value: decrypt(record.value, encryptionKey),
        environment: record.environment,
        project: record.project || '',
        description: record.description || '',
        created: record.created,
        updated: record.updated,
      }));

      setEnvVars(decryptedEnvVars);
      setError(null);
    } catch (err) {
      setError('Failed to fetch environment variables');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user, encryptionKey]);

  useEffect(() => {
    fetchEnvVars();
  }, [fetchEnvVars]);

  const addEnvVar = async (data: EnvVarForm) => {
    if (!user || !encryptionKey) throw new Error('Not authenticated');

    const encryptedData = {
      user: user.id,
      name: data.name,
      value: encrypt(data.value, encryptionKey),
      environment: data.environment,
      project: data.project || '',
      description: data.description || '',
    };

    await pb.collection('env_vars').create(encryptedData);
    await fetchEnvVars();
  };

  const updateEnvVar = async (id: string, data: EnvVarForm) => {
    if (!user || !encryptionKey) throw new Error('Not authenticated');

    const encryptedData = {
      name: data.name,
      value: encrypt(data.value, encryptionKey),
      environment: data.environment,
      project: data.project || '',
      description: data.description || '',
    };

    await pb.collection('env_vars').update(id, encryptedData);
    await fetchEnvVars();
  };

  const deleteEnvVar = async (id: string) => {
    await pb.collection('env_vars').delete(id);
    await fetchEnvVars();
  };

  const exportEnvFile = (environment?: string, project?: string) => {
    let filtered = envVars;
    
    if (environment && environment !== 'all') {
      filtered = filtered.filter(v => v.environment === environment || v.environment === 'all');
    }
    
    if (project) {
      filtered = filtered.filter(v => v.project === project || !v.project);
    }

    return filtered.map(v => `${v.name}=${v.value}`).join('\n');
  };

  // Parse .env file content into array of {name, value} pairs
  const parseEnvFile = (content: string): { name: string; value: string }[] => {
    const lines = content.split('\n');
    const result: { name: string; value: string }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Find first = sign (value can contain = signs)
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      
      const name = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();
      
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Validate name format
      if (/^[A-Z_][A-Z0-9_]*$/i.test(name)) {
        result.push({ name: name.toUpperCase(), value });
      }
    }
    
    return result;
  };

  // Import multiple env vars from parsed content
  const importEnvVars = async (
    parsedVars: { name: string; value: string }[],
    environment: EnvVarForm['environment'],
    project?: string,
    skipExisting?: boolean
  ): Promise<{ imported: number; skipped: number; errors: string[] }> => {
    if (!user || !encryptionKey) throw new Error('Not authenticated');

    const existingNames = new Set(envVars.map(v => v.name));
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const { name, value } of parsedVars) {
      try {
        if (skipExisting && existingNames.has(name)) {
          skipped++;
          continue;
        }

        const encryptedData = {
          user: user.id,
          name,
          value: encrypt(value, encryptionKey),
          environment,
          project: project || '',
          description: '',
        };

        await pb.collection('env_vars').create(encryptedData);
        imported++;
      } catch (err) {
        errors.push(`Failed to import ${name}`);
        console.error(err);
      }
    }

    await fetchEnvVars();
    return { imported, skipped, errors };
  };

  // Get unique projects from env vars
  const getProjects = (): string[] => {
    const projects = new Set<string>();
    envVars.forEach(v => {
      if (v.project) projects.add(v.project);
    });
    return Array.from(projects).sort();
  };

  // Group env vars by project
  const getEnvVarsByProject = (): Record<string, EnvironmentVariable[]> => {
    const grouped: Record<string, EnvironmentVariable[]> = {
      'Ungrouped': [],
    };

    envVars.forEach(v => {
      const projectKey = v.project || 'Ungrouped';
      if (!grouped[projectKey]) {
        grouped[projectKey] = [];
      }
      grouped[projectKey].push(v);
    });

    // Remove empty Ungrouped if there are none
    if (grouped['Ungrouped'].length === 0) {
      delete grouped['Ungrouped'];
    }

    return grouped;
  };

  return {
    envVars,
    isLoading,
    error,
    addEnvVar,
    updateEnvVar,
    deleteEnvVar,
    exportEnvFile,
    parseEnvFile,
    importEnvVars,
    getProjects,
    getEnvVarsByProject,
    refetch: fetchEnvVars,
  };
}
