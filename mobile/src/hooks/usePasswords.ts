import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbase';
import { encrypt, decrypt } from '@/lib/encryption';
import { useAuth } from '@/contexts/AuthContext';
import type { Password, PasswordForm } from '@/types';

export function usePasswords() {
  const { user, encryptionKey } = useAuth();
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPasswords = useCallback(async () => {
    if (!user || !encryptionKey) {
      setPasswords([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const records = await pb.collection('passwords').getFullList({
        filter: `user = "${user.id}"`,
        sort: '-created',
      });

      const decryptedPasswords = records.map((record) => ({
        id: record.id,
        user: record.user,
        name: record.name,
        username: decrypt(record.username, encryptionKey),
        password: decrypt(record.password, encryptionKey),
        url: record.url || '',
        notes: record.notes ? decrypt(record.notes, encryptionKey) : '',
        category: record.category || '',
        totpSecret: record.totpSecret ? decrypt(record.totpSecret, encryptionKey) : '',
        created: record.created,
        updated: record.updated,
      }));

      setPasswords(decryptedPasswords);
      setError(null);
    } catch (err) {
      setError('Failed to fetch passwords');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user, encryptionKey]);

  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords]);

  const addPassword = async (data: PasswordForm) => {
    if (!user || !encryptionKey) throw new Error('Not authenticated');

    const encryptedData = {
      user: user.id,
      name: data.name,
      username: encrypt(data.username, encryptionKey),
      password: encrypt(data.password, encryptionKey),
      url: data.url || '',
      notes: data.notes ? encrypt(data.notes, encryptionKey) : '',
      category: data.category || '',
      totpSecret: data.totpSecret ? encrypt(data.totpSecret, encryptionKey) : '',
    };

    await pb.collection('passwords').create(encryptedData);
    await fetchPasswords();
  };

  const updatePassword = async (id: string, data: PasswordForm) => {
    if (!user || !encryptionKey) throw new Error('Not authenticated');

    const encryptedData = {
      name: data.name,
      username: encrypt(data.username, encryptionKey),
      password: encrypt(data.password, encryptionKey),
      url: data.url || '',
      notes: data.notes ? encrypt(data.notes, encryptionKey) : '',
      category: data.category || '',
      totpSecret: data.totpSecret ? encrypt(data.totpSecret, encryptionKey) : '',
    };

    await pb.collection('passwords').update(id, encryptedData);
    await fetchPasswords();
  };

  const deletePassword = async (id: string) => {
    await pb.collection('passwords').delete(id);
    await fetchPasswords();
  };

  const getCategories = useCallback((): string[] => {
    const categories = new Set<string>();
    passwords.forEach(p => {
      if (p.category) categories.add(p.category);
    });
    return Array.from(categories).sort();
  }, [passwords]);

  return {
    passwords,
    isLoading,
    error,
    addPassword,
    updatePassword,
    deletePassword,
    getCategories,
    refetch: fetchPasswords,
  };
}
