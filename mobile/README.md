# SecureVault Mobile

React Native / Expo mobile application for SecureVault - a secure password and environment variable manager with client-side encryption.

## Features

- **Password Management**: Store, view, and manage passwords with TOTP support
- **Environment Variables**: Organize secrets by project and environment
- **Client-Side Encryption**: AES-256 encryption - data is encrypted before leaving your device
- **Master Password**: Secure vault access with PBKDF2 key derivation
- **Auto-Lock**: Automatic vault locking when app is backgrounded
- **Cross-Platform**: Works on iOS and Android
- **Synced with Web**: Same PocketBase backend as the web app

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on your physical device (optional)
- PocketBase server running (see main project README)

## Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment

Create a `.env` file in the `/mobile` directory:

```env
EXPO_PUBLIC_POCKETBASE_URL=http://your-pocketbase-server:8090
```

For local development with a device, use your machine's IP address:
```env
EXPO_PUBLIC_POCKETBASE_URL=http://192.168.1.100:8090
```

### 3. Start the Development Server

```bash
npx expo start
```

This will open the Expo Developer Tools. From there you can:
- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan the QR code with Expo Go app on your device

## Project Structure

```
mobile/
├── app/                      # Expo Router screens
│   ├── _layout.tsx          # Root layout with providers
│   ├── index.tsx            # Entry point with auth redirect
│   ├── (auth)/              # Authentication screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── unlock.tsx
│   └── (tabs)/              # Main app tabs
│       ├── _layout.tsx
│       ├── passwords.tsx
│       ├── env-vars.tsx
│       └── settings.tsx
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication & encryption state
│   ├── hooks/
│   │   ├── usePasswords.ts  # Password CRUD operations
│   │   └── useEnvVars.ts    # Environment variable operations
│   ├── lib/
│   │   ├── encryption.ts    # AES-256 encryption utilities
│   │   ├── pocketbase.ts    # PocketBase client setup
│   │   ├── theme.ts         # Design system (colors, typography)
│   │   └── totp.ts          # TOTP code generation
│   └── types/
│       └── index.ts         # TypeScript type definitions
├── app.json                 # Expo configuration
├── babel.config.js          # Babel configuration
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript configuration
```

## Security Features

### Client-Side Encryption
All sensitive data (passwords, environment variables) is encrypted on your device using AES-256 before being sent to the server. The server never sees your unencrypted data.

### Master Password
Your master password is used to derive an encryption key using PBKDF2 with 100,000 iterations. The password itself is never stored - only a salted hash for verification.

### Secure Storage
- Authentication tokens stored in `expo-secure-store` (Keychain on iOS, Keystore on Android)
- Master password hash and salt stored securely per-user

### Auto-Lock
- Vault locks immediately when app goes to background
- 5-minute inactivity timeout when app is active
- Requires master password to unlock

## Design System

The app follows the SecureVault design system:
- **Boxy/Industrial**: Zero border radius for sharp, modern look
- **High Contrast**: Dark green primary color
- **Uppercase Labels**: All labels use uppercase text
- **Monospace Secrets**: Passwords and codes displayed in monospace

### Colors
| Mode  | Primary      | Background |
|-------|--------------|------------|
| Light | `#0d1f14`    | `#ffffff`  |
| Dark  | `#22c55e`    | `#0a0a0a`  |

## Building for Production

### iOS
```bash
npx expo build:ios
# or with EAS
npx eas build --platform ios
```

### Android
```bash
npx expo build:android
# or with EAS
npx eas build --platform android
```

## Troubleshooting

### PocketBase Connection Issues
- Ensure PocketBase is running and accessible from your device
- Use your machine's IP address (not `localhost`) for physical devices
- Check firewall settings allow connections on port 8090

### Encryption Compatibility
The mobile app uses the same encryption scheme as the web app. Data created in one can be accessed in the other with the same master password.

### Expo Go Limitations
Some features may require a development build instead of Expo Go:
```bash
npx expo run:ios
npx expo run:android
```

## License

MIT License - see LICENSE.md in the root directory.
