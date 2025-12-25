import * as OTPAuth from 'otpauth';

/**
 * TOTP (Time-based One-Time Password) utilities
 */

// Generate a new TOTP secret
export function generateTOTPSecret(issuer: string, label: string): {
  secret: string;
  uri: string;
} {
  const totp = new OTPAuth.TOTP({
    issuer,
    label,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });
  
  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  };
}

// Generate current TOTP code from secret
export function generateTOTPCode(secret: string): string {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });
  
  return totp.generate();
}

// Verify a TOTP code
export function verifyTOTPCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(secret),
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  });
  
  // Allow 1 period window for clock drift
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

// Get remaining time until next TOTP code
export function getTOTPRemainingTime(): number {
  const now = Math.floor(Date.now() / 1000);
  return 30 - (now % 30);
}

// Parse a TOTP URI (otpauth://...)
export function parseTOTPUri(uri: string): {
  secret: string;
  issuer: string;
  label: string;
} | null {
  try {
    const otp = OTPAuth.URI.parse(uri);
    if (otp instanceof OTPAuth.TOTP) {
      return {
        secret: otp.secret.base32,
        issuer: otp.issuer || '',
        label: otp.label || '',
      };
    }
    return null;
  } catch {
    return null;
  }
}
