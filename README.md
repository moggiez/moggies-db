# Moggies DB NPM Package

Wrapper around moggies database tables.

# Table config

- Required properties: `tableName`, `hashKey`, `sortKey`
- `indexes` is an object where each property name should correspond to a global secondary index name and its value should be an object with `hashKey` and `sortKey` properties.

```javascript
{
    tableName: "jobs",
    hashKey: "JobId",
    sortKey: "TaskId",
    indexes: {
        JobTasksState: {
            hashKey: "JobId",
            sortKey: "State",
        },
    },
}
```

# Reading data

## Get all records with hashKey

- hashKey: `required`
- sortKey: `required`

```javascript
const db = require("@moggiez/moggies-db");
const table = new db.Table(config);
table.get({ hashKey: "hkValue", sortKey: "skValue" });
```

## Query for records

- hashKey: `required`
- sortKey: `optional`
- indexName: `optional`
  - the name of an existing DynamoDB Global Secondary Index
- filter: `optional`
  - an object with `expression` property describing the filtering clause and `attributes` property which should be an object where each property corresponds to a placeholder in `expression`

```javascript
const db = require("@moggiez/moggies-db");
const table = new db.Table(config);
table.query({
  hashKey: "hkValue",
  sortKey: "skValue",
  indexName: `gskName`,
  filter: {
    expression: "Version = :version",
    attributes: { version: "v0" },
  },
});
```

## Creating records

- hashKey: `required`
- sortKey: `required`
- record: `required`
  - the record object

```javascript
const db = require("@moggiez/moggies-db");
const table = new db.Table(config);
const record = {
  Name: "MyName",
  Age: 18,
  Description: "This is the value of a record property.",
};
table.update({ hashKey: "hkValue", sortKey: "skValue", record });
```

## Updating records

- hashKey: `required`
- sortKey: `required`
- updatedFields: `required`
  - the object containing properties to update

```javascript
const db = require("@moggiez/moggies-db");
const table = new db.Table(config);
const updatedFields = {
  Name: "MyNewName",
  Age: 21,
  Description: "This field has a new value.",
};
table.update({ hashKey: "hkValue", sortKey: "skValue", updatedFields });
```

## Deleting records

- hashKey: `required`
- sortKey: `required`

```javascript
const db = require("@moggiez/moggies-db");
const table = new db.Table(config);
table.delete({ hashKey: "hkValue", sortKey: "skValue" });
```
