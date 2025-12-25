# SecureVault - Password & Environment Variable Manager

A secure application to manage your passwords, environment variables, and TOTP (2FA) codes. Built with Next.js and PocketBase.

## Features

- **Password Management**: Store and manage website passwords with encrypted storage
- **Environment Variables**: Manage env vars for different environments (dev, staging, prod)
- **TOTP Generator**: Built-in time-based one-time password generator for 2FA
- **Client-side Encryption**: All sensitive data is encrypted before being stored
- **Master Password**: Protect your vault with a master password
- **Auto-lock**: Automatically locks after 5 minutes of inactivity
- **Export .env files**: Export environment variables as .env files
- **Responsive UI**: Works on desktop and mobile devices

## Security Features

- **AES-256 Encryption**: All sensitive data (passwords, env values, TOTP secrets) are encrypted using AES-256
- **PBKDF2 Key Derivation**: Master password is converted to encryption key using PBKDF2 with 100,000 iterations
- **Zero-Knowledge Architecture**: The server never sees your decrypted data
- **Master Password Never Stored**: Only a hash is stored locally for verification

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: PocketBase (SQLite-based)
- **Encryption**: crypto-js (AES-256, PBKDF2)
- **TOTP**: otpauth library
- **UI Components**: Radix UI, Lucide Icons

## Prerequisites

- Node.js 18+
- PocketBase (download from https://pocketbase.io/docs/)

## Getting Started

### 1. Clone and Install Dependencies

```bash
cd enviroment-variable-manager
npm install
```

### 2. Set Up PocketBase

1. Download PocketBase from https://pocketbase.io/docs/
2. Extract it to the `pocketbase` directory
3. Start PocketBase:

```bash
cd pocketbase
./pocketbase serve
```

4. Open http://127.0.0.1:8090/_/ and create an admin account
5. Go to **Settings > Import collections**
6. Import the schema from `pocketbase/pb_schema.json`

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` if your PocketBase is running on a different URL.

### 4. Run the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Usage

### First Time Setup

1. Register a new account
2. Set your **Master Password** - this encrypts all your data
   - **Important**: This password cannot be recovered if forgotten!
3. Start adding passwords and environment variables

### Adding Passwords

1. Go to the Passwords section
2. Click "Add Password"
3. Fill in the name, username, and password
4. Optionally add a TOTP secret for 2FA support
5. Click Save

### Adding Environment Variables

1. Go to the Env Variables section
2. Click "Add Variable"
3. Enter the variable name (e.g., `DATABASE_URL`)
4. Enter the value
5. Select the environment (development, staging, production, or all)
6. Click Save

### Exporting .env Files

1. Go to the Env Variables section
2. Click "Export .env"
3. Select the target environment
4. Click Download to save the file

### Using TOTP Codes

1. Add a TOTP secret to a password entry
2. Go to the TOTP Codes section
3. Codes refresh automatically every 30 seconds
4. Click the copy button to copy a code

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Auth pages (login, register)
│   └── (dashboard)/       # Dashboard pages
├── components/            # React components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   ├── encryption.ts     # Encryption utilities
│   ├── pocketbase.ts     # PocketBase client
│   └── totp.ts          # TOTP utilities
└── types/               # TypeScript types
```

## Security Notes

- All sensitive data is encrypted client-side before being sent to PocketBase
- The encryption key is derived from your master password using PBKDF2
- The master password itself is never stored or transmitted
- Only the password hash (for verification) and salt are stored locally
- Session auto-locks after 5 minutes of inactivity

## License

MIT
