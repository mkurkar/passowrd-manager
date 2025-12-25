/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_passwords_001",
    "type": "base",
    "name": "passwords",
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
        "autogeneratePattern": "",
        "min": 1,
        "max": 255,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text_username",
        "name": "username",
        "type": "text",
        "required": true,
        "presentable": false,
        "system": false,
        "autogeneratePattern": "",
        "min": 0,
        "max": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text_password",
        "name": "password",
        "type": "text",
        "required": true,
        "presentable": false,
        "system": false,
        "autogeneratePattern": "",
        "min": 0,
        "max": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text_url",
        "name": "url",
        "type": "text",
        "required": false,
        "presentable": false,
        "system": false,
        "autogeneratePattern": "",
        "min": 0,
        "max": 500,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text_notes",
        "name": "notes",
        "type": "text",
        "required": false,
        "presentable": false,
        "system": false,
        "autogeneratePattern": "",
        "min": 0,
        "max": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text_category",
        "name": "category",
        "type": "text",
        "required": false,
        "presentable": false,
        "system": false,
        "autogeneratePattern": "",
        "min": 0,
        "max": 100,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text_totpSecret",
        "name": "totpSecret",
        "type": "text",
        "required": false,
        "presentable": false,
        "system": false,
        "autogeneratePattern": "",
        "min": 0,
        "max": 0,
        "pattern": ""
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
      "CREATE INDEX idx_passwords_user ON passwords (user)",
      "CREATE INDEX idx_passwords_category ON passwords (category)",
      "CREATE INDEX idx_passwords_name ON passwords (name)"
    ]
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("passwords");

  return app.delete(collection);
});
