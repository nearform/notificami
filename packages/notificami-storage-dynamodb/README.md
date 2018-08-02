# DynamoDB storage

This moudle implements a storage based on [DynamoDB](https://aws.amazon.com/dynamodb) that replace the default postgres module.

## Install

```
npm install --save notifications-storage-dynamodb
```

To use the plugin add the `storage` entry in `config`

```
const config = {
  notifications: {
    channels: {
      ...
    },
    storage: {
      plugin: 'notifications-storage-dynamodb',
      options: {
       TableName: 'notifications',
       ApplicationUserAccessKey: 'AKIAJVUSIUSERACCESSKEY',
       ApplicationUserSecretAccessKey: 'c9AHgAjhpsercretuseraccesskey',
       Region: 'eu-west-1'
     }
    },
    strategies: {
      ...
    }
  }
}
```


### Dynamodb table
The dynamodb table is buld using the following configuration

```
{
  "AttributeDefinitions": [
    {
      "AttributeName": "UserIdentifier",
      "AttributeType": "S"
    },
    {
      "AttributeName": "Id",
      "AttributeType": "S"
    }
  ],
  "KeySchema": [
    {
      "AttributeName": "UserIdentifier",
      "KeyType": "HASH"
    },
    {
      "AttributeName": "Id",
      "KeyType": "RANGE"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "UUIDIndex",
      "KeySchema": [{
        "AttributeName": "Id",
        "KeyType": "HASH"
      }],
      "Projection": {
        "ProjectionType": "ALL"
      },
      "ProvisionedThroughput": {
        "ReadCapacityUnits": 1,
        "WriteCapacityUnits": 1
      }
    }
  ],
  "ProvisionedThroughput": {
    "ReadCapacityUnits": 1,
    "WriteCapacityUnits": 1
  },
  "TableName": "notifications"
}
```
