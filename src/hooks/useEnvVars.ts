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

  return {
    envVars,
    isLoading,
    error,
    addEnvVar,
    updateEnvVar,
    deleteEnvVar,
    exportEnvFile,
    refetch: fetchEnvVars,
  };
}
