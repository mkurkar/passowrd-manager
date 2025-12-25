import CryptoJS from 'crypto-js';

/**
 * Encryption utilities for secure data storage
 * Uses AES-256 encryption with the user's master password
 */

// Generate a key from the master password using PBKDF2
export function deriveKey(masterPassword: string, salt: string): string {
  return CryptoJS.PBKDF2(masterPassword, salt, {
    keySize: 256 / 32,
    iterations: 100000,
  }).toString();
}

// Generate a random salt
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

// Encrypt data with the derived key
export function encrypt(data: string, key: string): string {
  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Hex.parse(key), {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  
  // Prepend IV to the encrypted data
  return iv.toString() + ':' + encrypted.ciphertext.toString();
}

// Decrypt data with the derived key
export function decrypt(encryptedData: string, key: string): string {
  try {
    const [ivHex, ciphertext] = encryptedData.split(':');
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: CryptoJS.enc.Hex.parse(ciphertext) } as CryptoJS.lib.CipherParams,
      CryptoJS.enc.Hex.parse(key),
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    throw new Error('Failed to decrypt data. Invalid key or corrupted data.');
  }
}

// Hash the master password for verification (stored separately from encryption key)
export function hashPassword(password: string, salt: string): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 100000,
  }).toString();
}

// Generate a random password
export function generatePassword(length: number = 16, options?: {
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}): string {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options || {};
  
  let chars = '';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
  
  let password = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length];
  }
  
  return password;
}
