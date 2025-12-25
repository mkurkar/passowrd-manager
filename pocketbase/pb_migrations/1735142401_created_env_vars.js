/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "pbc_env_vars_001",
    "type": "base",
    "name": "env_vars",
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
        "pattern": "^[A-Za-z_][A-Za-z0-9_]*$"
      },
      {
        "hidden": false,
        "id": "text_value",
        "name": "value",
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
        "id": "select_environment",
        "name": "environment",
        "type": "select",
        "required": true,
        "presentable": false,
        "system": false,
        "maxSelect": 1,
        "values": [
          "development",
          "staging",
          "production",
          "all"
        ]
      },
      {
        "hidden": false,
        "id": "text_project",
        "name": "project",
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
        "id": "text_description",
        "name": "description",
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
      "CREATE INDEX idx_env_vars_user ON env_vars (user)",
      "CREATE INDEX idx_env_vars_environment ON env_vars (environment)",
      "CREATE INDEX idx_env_vars_project ON env_vars (project)",
      "CREATE UNIQUE INDEX idx_env_vars_unique ON env_vars (user, name, environment, project)"
    ]
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("env_vars");

  return app.delete(collection);
});
