# PocketBase Migrations

This document provides instructions for creating and managing PocketBase migrations.

## Overview

Migrations are JavaScript files that define database schema changes. They allow version-controlled, reproducible database setup.

## Migration File Structure

```
pocketbase/pb_migrations/
├── 1735142400_created_passwords.js
├── 1735142401_created_env_vars.js
└── {timestamp}_{description}.js
```

## File Naming Convention

```
{unix_timestamp}_{snake_case_description}.js
```

Example: `1735142400_created_passwords.js`

To generate a timestamp:
```bash
date +%s
# Output: 1735142400
```

## Migration Template

```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // UP migration - create/modify
  const collection = new Collection({
    // Collection definition
  });
  return app.save(collection);
}, (app) => {
  // DOWN migration - rollback
  const collection = app.findCollectionByNameOrId("collection_name");
  return app.delete(collection);
});
```

## Creating a New Collection

```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_collection_name_001",  // Unique ID
    "type": "base",                    // base, auth, or view
    "name": "collection_name",
    "system": false,
    
    // Security rules
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "viewRule": "@request.auth.id != '' && user = @request.auth.id",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != '' && user = @request.auth.id",
    "deleteRule": "@request.auth.id != '' && user = @request.auth.id",
    
    "fields": [
      // Field definitions
    ],
    
    "indexes": [
      // Index definitions
    ]
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("collection_name");
  return app.delete(collection);
});
```

## Field Types

### ID Field (Required)
```javascript
{
  "hidden": false,
  "id": "text3208210256",
  "autogeneratePattern": "[a-z0-9]{15}",
  "max": 15,
  "min": 15,
  "name": "id",
  "pattern": "^[a-z0-9]+$",
  "presentable": false,
  "primaryKey": true,
  "required": true,
  "system": true,
  "type": "text"
}
```

### Text Field
```javascript
{
  "hidden": false,
  "id": "text_fieldname",
  "name": "fieldname",
  "type": "text",
  "required": true,           // or false
  "presentable": false,       // true to show in list view
  "system": false,
  "autogeneratePattern": "",  // e.g., "[a-z0-9]{8}" for auto-generate
  "min": 0,                   // min length (0 = no limit)
  "max": 255,                 // max length (0 = no limit)
  "pattern": ""               // regex pattern, e.g., "^[A-Za-z_][A-Za-z0-9_]*$"
}
```

### Relation Field
```javascript
{
  "hidden": false,
  "id": "relation_user",
  "name": "user",
  "type": "relation",
  "required": true,
  "presentable": false,
  "system": false,
  "collectionId": "_pb_users_auth_",  // Target collection ID
  "cascadeDelete": true,               // Delete related records
  "minSelect": 0,
  "maxSelect": 1                       // 1 = single, >1 = multiple
}
```

### Select Field
```javascript
{
  "hidden": false,
  "id": "select_environment",
  "name": "environment",
  "type": "select",
  "required": true,
  "presentable": false,
  "system": false,
  "maxSelect": 1,              // 1 = single select, >1 = multi-select
  "values": [
    "development",
    "staging",
    "production",
    "all"
  ]
}
```

### Number Field
```javascript
{
  "hidden": false,
  "id": "number_amount",
  "name": "amount",
  "type": "number",
  "required": false,
  "presentable": false,
  "system": false,
  "min": null,                 // null = no min
  "max": null,                 // null = no max
  "noDecimal": false           // true for integers only
}
```

### Boolean Field
```javascript
{
  "hidden": false,
  "id": "bool_active",
  "name": "active",
  "type": "bool",
  "required": false,
  "presentable": false,
  "system": false
}
```

### Email Field
```javascript
{
  "hidden": false,
  "id": "email_contact",
  "name": "contact_email",
  "type": "email",
  "required": false,
  "presentable": false,
  "system": false,
  "exceptDomains": [],
  "onlyDomains": []
}
```

### URL Field
```javascript
{
  "hidden": false,
  "id": "url_website",
  "name": "website",
  "type": "url",
  "required": false,
  "presentable": false,
  "system": false,
  "exceptDomains": [],
  "onlyDomains": []
}
```

### Date Field
```javascript
{
  "hidden": false,
  "id": "date_due",
  "name": "due_date",
  "type": "date",
  "required": false,
  "presentable": false,
  "system": false,
  "min": "",
  "max": ""
}
```

### Autodate Field (Timestamps)
```javascript
// Created timestamp
{
  "hidden": false,
  "id": "autodate_created",
  "name": "created",
  "type": "autodate",
  "presentable": false,
  "system": false,
  "onCreate": true,
  "onUpdate": false
}

// Updated timestamp
{
  "hidden": false,
  "id": "autodate_updated",
  "name": "updated",
  "type": "autodate",
  "presentable": false,
  "system": false,
  "onCreate": true,
  "onUpdate": true
}
```

### JSON Field
```javascript
{
  "hidden": false,
  "id": "json_metadata",
  "name": "metadata",
  "type": "json",
  "required": false,
  "presentable": false,
  "system": false,
  "maxSize": 2000000  // Max size in bytes
}
```

### File Field
```javascript
{
  "hidden": false,
  "id": "file_avatar",
  "name": "avatar",
  "type": "file",
  "required": false,
  "presentable": false,
  "system": false,
  "maxSelect": 1,
  "maxSize": 5242880,  // 5MB
  "mimeTypes": [
    "image/jpeg",
    "image/png",
    "image/gif"
  ],
  "thumbs": ["100x100", "200x200"]
}
```

## Indexes

```javascript
"indexes": [
  // Single column index
  "CREATE INDEX idx_collection_field ON collection_name (field)",
  
  // Composite index
  "CREATE INDEX idx_collection_multi ON collection_name (field1, field2)",
  
  // Unique index
  "CREATE UNIQUE INDEX idx_collection_unique ON collection_name (field1, field2)",
  
  // Index on user (common pattern)
  "CREATE INDEX idx_collection_user ON collection_name (user)"
]
```

## Security Rules

### Common Patterns

```javascript
// User can only access own records
"listRule": "@request.auth.id != '' && user = @request.auth.id"
"viewRule": "@request.auth.id != '' && user = @request.auth.id"
"updateRule": "@request.auth.id != '' && user = @request.auth.id"
"deleteRule": "@request.auth.id != '' && user = @request.auth.id"

// Any authenticated user can create
"createRule": "@request.auth.id != ''"

// Public read access
"listRule": ""
"viewRule": ""

// Admin only
"listRule": "@request.auth.role = 'admin'"

// No access (null)
"listRule": null
```

### Rule Syntax

```javascript
// Check authenticated
"@request.auth.id != ''"

// Check field matches auth user
"user = @request.auth.id"

// Multiple conditions (AND)
"@request.auth.id != '' && user = @request.auth.id"

// Multiple conditions (OR)
"status = 'published' || user = @request.auth.id"

// Check related record
"@request.auth.id != '' && project.owner = @request.auth.id"

// Check array contains
"@request.auth.id ?= members"
```

## View Collections

View collections are virtual tables based on SQL queries.

```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_view_001",
    "type": "view",  // Important: type must be "view"
    "name": "env_vars_by_project",
    "system": false,
    
    // View query
    "viewQuery": `
      SELECT 
        id,
        user,
        project,
        COUNT(*) as total_vars,
        GROUP_CONCAT(name, ', ') as var_names
      FROM env_vars
      GROUP BY user, project
    `,
    
    // Rules for the view
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "viewRule": "@request.auth.id != '' && user = @request.auth.id",
    
    // Field definitions must match query output
    "fields": [
      {
        "id": "text_id",
        "name": "id",
        "type": "text",
        "primaryKey": true
      },
      {
        "id": "relation_user",
        "name": "user",
        "type": "relation",
        "collectionId": "_pb_users_auth_"
      },
      {
        "id": "text_project",
        "name": "project",
        "type": "text"
      },
      {
        "id": "number_total",
        "name": "total_vars",
        "type": "number"
      },
      {
        "id": "text_names",
        "name": "var_names",
        "type": "text"
      }
    ]
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("env_vars_by_project");
  return app.delete(collection);
});
```

## Modifying Existing Collections

### Add a Field
```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("passwords");
  
  collection.fields.push({
    "hidden": false,
    "id": "text_new_field",
    "name": "new_field",
    "type": "text",
    "required": false,
    "presentable": false,
    "system": false,
    "min": 0,
    "max": 0,
    "pattern": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("passwords");
  
  collection.fields = collection.fields.filter(f => f.name !== "new_field");

  return app.save(collection);
});
```

### Remove a Field
```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("passwords");
  
  collection.fields = collection.fields.filter(f => f.name !== "field_to_remove");

  return app.save(collection);
}, (app) => {
  // Down migration: add the field back
  const collection = app.findCollectionByNameOrId("passwords");
  
  collection.fields.push({
    // Field definition
  });

  return app.save(collection);
});
```

### Add an Index
```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("passwords");
  
  collection.indexes.push(
    "CREATE INDEX idx_passwords_new ON passwords (new_field)"
  );

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("passwords");
  
  collection.indexes = collection.indexes.filter(
    idx => !idx.includes("idx_passwords_new")
  );

  return app.save(collection);
});
```

## Running Migrations

Migrations run automatically when PocketBase starts:

```bash
./pocketbase serve
```

Or manually:

```bash
./pocketbase migrate
```

## Best Practices

1. **One change per migration**: Keep migrations focused on a single change
2. **Always write down migrations**: Enable rollback capability
3. **Use descriptive names**: `1735142400_add_category_to_passwords.js`
4. **Test migrations**: Run on a copy of production data first
5. **Version control**: Commit migrations with your code
6. **Don't modify existing migrations**: Create new ones instead
7. **Use unique IDs**: Prefix with `pbc_{collection}_{number}`

## Example: Complete Collection

```javascript
/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_totp_001",
    "type": "base",
    "name": "totp_accounts",
    "system": false,
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "viewRule": "@request.auth.id != '' && user = @request.auth.id",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != '' && user = @request.auth.id",
    "deleteRule": "@request.auth.id != '' && user = @request.auth.id",
    "fields": [
      {
        "hidden": false,
        "id": "text3208210256",
        "autogeneratePattern": "[a-z0-9]{15}",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "relation_user",
        "name": "user",
        "type": "relation",
        "required": true,
        "presentable": false,
        "system": false,
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": true,
        "minSelect": 0,
        "maxSelect": 1
      },
      {
        "hidden": false,
        "id": "text_name",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": true,
        "system": false,
        "min": 1,
        "max": 255
      },
      {
        "hidden": false,
        "id": "text_issuer",
        "name": "issuer",
        "type": "text",
        "required": true,
        "presentable": false,
        "system": false,
        "min": 1,
        "max": 255
      },
      {
        "hidden": false,
        "id": "text_secret",
        "name": "secret",
        "type": "text",
        "required": true,
        "presentable": false,
        "system": false,
        "min": 0,
        "max": 0
      },
      {
        "hidden": false,
        "id": "autodate_created",
        "name": "created",
        "type": "autodate",
        "presentable": false,
        "system": false,
        "onCreate": true,
        "onUpdate": false
      },
      {
        "hidden": false,
        "id": "autodate_updated",
        "name": "updated",
        "type": "autodate",
        "presentable": false,
        "system": false,
        "onCreate": true,
        "onUpdate": true
      }
    ],
    "indexes": [
      "CREATE INDEX idx_totp_user ON totp_accounts (user)",
      "CREATE INDEX idx_totp_issuer ON totp_accounts (issuer)"
    ]
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("totp_accounts");
  return app.delete(collection);
});
```
