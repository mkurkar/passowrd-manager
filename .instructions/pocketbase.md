# PocketBase Instructions

This document provides instructions for working with PocketBase in the SecureVault application.

## Overview

PocketBase is used as the backend database for SecureVault. It provides:
- SQLite-based data storage
- Built-in authentication
- Real-time subscriptions
- REST API
- JavaScript SDK

## Directory Structure

```
pocketbase/
├── pocketbase              # PocketBase executable
├── pb_data/                # Database files (gitignored in production)
│   ├── data.db            # Main SQLite database
│   ├── auxiliary.db       # Auxiliary data
│   └── types.d.ts         # TypeScript definitions
├── pb_migrations/          # Database migrations
│   ├── 1735142400_created_passwords.js
│   ├── 1735142401_created_env_vars.js
│   └── ...
└── pb_schema.json          # Schema export (optional)
```

## Running PocketBase

```bash
# Start PocketBase server
cd pocketbase
./pocketbase serve

# With specific host/port
./pocketbase serve --http="127.0.0.1:8090"

# Admin UI available at: http://127.0.0.1:8090/_/
```

## Collections

### Users (Built-in Auth Collection)
PocketBase provides a built-in `users` auth collection with:
- `id` - Unique identifier
- `email` - User email (unique)
- `name` - Display name
- `password` - Hashed password (managed by PocketBase)
- `created` / `updated` - Timestamps

### passwords
Stores encrypted password entries.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | text | auto | Primary key |
| user | relation | yes | Reference to users collection |
| name | text | yes | Entry name (e.g., "GitHub") |
| username | text | yes | Encrypted username |
| password | text | yes | Encrypted password |
| url | text | no | Website URL |
| notes | text | no | Encrypted notes |
| category | text | no | Category for organization |
| totpSecret | text | no | Encrypted TOTP secret |
| created | autodate | auto | Creation timestamp |
| updated | autodate | auto | Update timestamp |

### env_vars
Stores encrypted environment variables.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | text | auto | Primary key |
| user | relation | yes | Reference to users collection |
| name | text | yes | Variable name (e.g., DATABASE_URL) |
| value | text | yes | Encrypted value |
| environment | select | yes | development/staging/production/all |
| project | text | no | Project/app name for grouping |
| description | text | no | Description of the variable |
| created | autodate | auto | Creation timestamp |
| updated | autodate | auto | Update timestamp |

## Security Rules

All collections use row-level security:

```javascript
{
  "listRule": "@request.auth.id != '' && user = @request.auth.id",
  "viewRule": "@request.auth.id != '' && user = @request.auth.id",
  "createRule": "@request.auth.id != ''",
  "updateRule": "@request.auth.id != '' && user = @request.auth.id",
  "deleteRule": "@request.auth.id != '' && user = @request.auth.id"
}
```

This ensures:
- Users must be authenticated
- Users can only access their own records
- `user` field is automatically validated against the authenticated user

## Frontend Integration

### PocketBase Client Setup

```typescript
// src/lib/pocketbase.ts
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

export default pb;
```

### Authentication

```typescript
// Register
await pb.collection('users').create({
  email: 'user@example.com',
  password: 'securepassword',
  passwordConfirm: 'securepassword',
  name: 'John Doe',
});

// Login
const authData = await pb.collection('users').authWithPassword(
  'user@example.com',
  'securepassword'
);

// Current user
const user = pb.authStore.model;

// Logout
pb.authStore.clear();

// Check if authenticated
const isValid = pb.authStore.isValid;
```

### CRUD Operations

```typescript
// Create
const record = await pb.collection('passwords').create({
  user: pb.authStore.model.id,
  name: 'GitHub',
  username: encryptedUsername,
  password: encryptedPassword,
  url: 'https://github.com',
});

// Read all (with filter)
const records = await pb.collection('passwords').getFullList({
  filter: `user = "${pb.authStore.model.id}"`,
  sort: '-created',
});

// Read one
const record = await pb.collection('passwords').getOne('RECORD_ID');

// Update
await pb.collection('passwords').update('RECORD_ID', {
  name: 'Updated Name',
});

// Delete
await pb.collection('passwords').delete('RECORD_ID');
```

### Filtering and Sorting

```typescript
// Filter examples
const records = await pb.collection('env_vars').getFullList({
  filter: `user = "${userId}" && environment = "production"`,
  sort: '-created',
});

// Multiple conditions
const records = await pb.collection('env_vars').getFullList({
  filter: `user = "${userId}" && (environment = "production" || environment = "all")`,
});

// Search
const records = await pb.collection('passwords').getFullList({
  filter: `user = "${userId}" && name ~ "${searchQuery}"`,
});
```

## Client-Side Encryption

**Important**: All sensitive data is encrypted client-side before sending to PocketBase.

```typescript
// src/lib/encryption.ts
import CryptoJS from 'crypto-js';

// Derive key from master password
export function deriveKey(masterPassword: string, salt: string): string {
  return CryptoJS.PBKDF2(masterPassword, salt, {
    keySize: 256 / 32,
    iterations: 100000,
  }).toString();
}

// Encrypt data
export function encrypt(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

// Decrypt data
export function decrypt(encryptedData: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

### Usage Pattern

```typescript
// In hooks (e.g., usePasswords.ts)
const { encryptionKey } = useAuth();

// When saving
const encryptedData = {
  user: user.id,
  name: data.name,  // Not encrypted (for search)
  username: encrypt(data.username, encryptionKey),
  password: encrypt(data.password, encryptionKey),
};
await pb.collection('passwords').create(encryptedData);

// When reading
const records = await pb.collection('passwords').getFullList();
const decrypted = records.map(record => ({
  ...record,
  username: decrypt(record.username, encryptionKey),
  password: decrypt(record.password, encryptionKey),
}));
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

## Indexes

Collections have indexes for common queries:

```javascript
// passwords collection
"CREATE INDEX idx_passwords_user ON passwords (user)"
"CREATE INDEX idx_passwords_category ON passwords (category)"
"CREATE INDEX idx_passwords_name ON passwords (name)"

// env_vars collection
"CREATE INDEX idx_env_vars_user ON env_vars (user)"
"CREATE INDEX idx_env_vars_environment ON env_vars (environment)"
"CREATE INDEX idx_env_vars_project ON env_vars (project)"
"CREATE UNIQUE INDEX idx_env_vars_unique ON env_vars (user, name, environment, project)"
```

## Backup and Restore

```bash
# Backup (copy pb_data directory)
cp -r pocketbase/pb_data pocketbase/pb_data_backup

# Restore
cp -r pocketbase/pb_data_backup pocketbase/pb_data
```

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure PocketBase is running and the URL is correct
2. **Auth errors**: Check if token is expired, re-authenticate if needed
3. **Permission denied**: Verify security rules match the authenticated user

### Debug Mode

```bash
# Run with verbose logging
./pocketbase serve --debug
```
