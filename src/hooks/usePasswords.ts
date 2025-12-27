"use client"

import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbase';
import { encrypt, decrypt } from '@/lib/encryption';
import { useAuth } from './useAuth';
import type { Password, PasswordForm } from '@/types';

// Common CSV column name mappings for different password managers
const COLUMN_MAPPINGS: Record<string, keyof PasswordForm> = {
  // Name variations
  'name': 'name',
  'title': 'name',
  'site': 'name',
  'service': 'name',
  
  // Username variations  
  'username': 'username',
  'user': 'username',
  'email': 'username',
  'login': 'username',
  'login_username': 'username',
  'account': 'username',
  
  // Password variations
  'password': 'password',
  'pass': 'password',
  'login_password': 'password',
  'secret': 'password',
  
  // URL variations
  'url': 'url',
  'uri': 'url',
  'website': 'url',
  'site_url': 'url',
  'login_uri': 'url',
  'web site': 'url',
  
  // Notes variations
  'notes': 'notes',
  'note': 'notes',
  'comments': 'notes',
  'comment': 'notes',
  'extra': 'notes',
  
  // Category variations
  'category': 'category',
  'folder': 'category',
  'group': 'category',
  'type': 'category',
  
  // TOTP variations
  'totp': 'totpSecret',
  'totpsecret': 'totpSecret',
  'totp_secret': 'totpSecret',
  'otp': 'totpSecret',
  '2fa': 'totpSecret',
};

export interface ParsedPassword {
  name: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category?: string;
  totpSecret?: string;
  raw: Record<string, string>;
}

export interface CSVColumnMapping {
  csvColumn: string;
  mappedTo: keyof PasswordForm | null;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * Parse a CSV string into rows and columns
 * Handles quoted values, commas within quotes, and various line endings
 */
function parseCSVContent(content: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  // Handle different line endings and quoted values
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentLine += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      if (char === '\r') i++;
    } else if (char === '\r' && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  
  // Parse each line into columns
  const parseRow = (line: string): string[] => {
    const columns: string[] = [];
    let current = '';
    let inQ = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (!inQ) {
          inQ = true;
        } else if (nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQ = false;
        }
      } else if (char === ',' && !inQ) {
        columns.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    columns.push(current.trim());
    
    return columns;
  };
  
  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, '').trim());
  const rows = lines.slice(1).map(parseRow);
  
  return { headers, rows };
}

/**
 * Auto-detect column mappings based on header names
 */
export function detectColumnMappings(headers: string[]): CSVColumnMapping[] {
  return headers.map(header => {
    const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    
    // Try exact match first
    let mappedTo: keyof PasswordForm | null = COLUMN_MAPPINGS[normalizedHeader] || null;
    
    // Try partial matches
    if (!mappedTo) {
      for (const [key, value] of Object.entries(COLUMN_MAPPINGS)) {
        if (normalizedHeader.includes(key) || key.includes(normalizedHeader)) {
          mappedTo = value;
          break;
        }
      }
    }
    
    return { csvColumn: header, mappedTo };
  });
}

/**
 * Parse CSV content with column mappings
 */
export function parsePasswordCSV(
  content: string,
  customMappings?: CSVColumnMapping[]
): { passwords: ParsedPassword[]; headers: string[]; mappings: CSVColumnMapping[] } {
  const { headers, rows } = parseCSVContent(content);
  
  if (headers.length === 0) {
    return { passwords: [], headers: [], mappings: [] };
  }
  
  const mappings = customMappings || detectColumnMappings(headers);
  
  const passwords: ParsedPassword[] = rows
    .filter(row => row.some(cell => cell.trim()))
    .map(row => {
      const raw: Record<string, string> = {};
      headers.forEach((header, i) => {
        raw[header] = row[i] || '';
      });
      
      const password: ParsedPassword = {
        name: '',
        username: '',
        password: '',
        raw,
      };
      
      mappings.forEach((mapping, index) => {
        if (mapping.mappedTo && row[index]) {
          const value = row[index].replace(/^["']|["']$/g, '').trim();
          if (mapping.mappedTo === 'name') password.name = value;
          else if (mapping.mappedTo === 'username') password.username = value;
          else if (mapping.mappedTo === 'password') password.password = value;
          else if (mapping.mappedTo === 'url') password.url = value;
          else if (mapping.mappedTo === 'notes') password.notes = value;
          else if (mapping.mappedTo === 'category') password.category = value;
          else if (mapping.mappedTo === 'totpSecret') password.totpSecret = value;
        }
      });
      
      // If name is missing, try to generate from URL
      if (!password.name && password.url) {
        try {
          const url = new URL(password.url.startsWith('http') ? password.url : `https://${password.url}`);
          password.name = url.hostname.replace('www.', '');
        } catch {
          password.name = password.url;
        }
      }
      
      return password;
    });
  
  return { passwords, headers, mappings };
}

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

      console.log('Fetched password records:', records.length);

      // Skip if no records
      if (records.length === 0) {
        setPasswords([]);
        setError(null);
        return;
      }

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

  const importPasswords = async (
    parsedPasswords: ParsedPassword[],
    options: { skipExisting?: boolean; defaultCategory?: string } = {}
  ): Promise<ImportResult> => {
    if (!user || !encryptionKey) throw new Error('Not authenticated');

    const { skipExisting = true, defaultCategory = '' } = options;
    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

    // Get existing passwords for duplicate detection
    const existingNames = new Set(passwords.map(p => `${p.name.toLowerCase()}:${p.username.toLowerCase()}`));

    for (const parsed of parsedPasswords) {
      // Skip if missing required fields
      if (!parsed.name || !parsed.username || !parsed.password) {
        result.errors.push(`Skipped entry with missing required fields: ${parsed.name || 'unnamed'}`);
        result.skipped++;
        continue;
      }

      // Check for duplicates
      const key = `${parsed.name.toLowerCase()}:${parsed.username.toLowerCase()}`;
      if (skipExisting && existingNames.has(key)) {
        result.skipped++;
        continue;
      }

      try {
        const encryptedData = {
          user: user.id,
          name: parsed.name,
          username: encrypt(parsed.username, encryptionKey),
          password: encrypt(parsed.password, encryptionKey),
          url: parsed.url || '',
          notes: parsed.notes ? encrypt(parsed.notes, encryptionKey) : '',
          category: parsed.category || defaultCategory,
          totpSecret: parsed.totpSecret ? encrypt(parsed.totpSecret, encryptionKey) : '',
        };

        await pb.collection('passwords').create(encryptedData);
        existingNames.add(key);
        result.imported++;
      } catch (err) {
        result.errors.push(`Failed to import "${parsed.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    await fetchPasswords();
    return result;
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
    importPasswords,
    getCategories,
    refetch: fetchPasswords,
  };
}
