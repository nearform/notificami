# DynamoDB storage

This moudle implements a storage based on [DynamoDB](https://aws.amazon.com/dynamodb) that replace the default postgres module.

## Install

```
npm install --save @nearform/notificami-storage-dynamodb
```

To use the plugin add the `storage` entry in `config`

```
const config = {
  notifications: {
    channels: {
      ...
    },
    storage: {
      plugin: '@nearform/notificami-storage-dynamodb',
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

## Configuration
To configure the plugin a stack file with the credentials should be passed using the ENV param `DDB_STACK_PATH`

```
DDB_STACK_PATH=\"pathToAwsConfig/stack.json\" node index.js
```

where stack.json is a Json file containing all the parameters required to connecto to the AWS services

```
{
  "TableName": "notifications-dev",
  "SQSQueueName": "notifications-dev-queue.fifo",
  "SQSQueueARN": "arn:aws:sqs:eu-west-1:912147919779:notifications-dev-queue.fifo",
  "SQSQueueURL": "https://sqs.eu-west-1.amazonaws.com/912147919779/notifications-dev-queue.fifo",
  "Region": "eu-west-1",
  "DynamoTableARN": "arn:aws:dynamodb:eu-west-1:1234567890:table/notifications-dev",
  "ApplicationUserAccessKey": "AKAACCESSUSERKEY",
  "ApplicationUserSecretAccessKey": "c9AHgAjhpf-somesecretkey",
}
```

To build an AWS infrastructure follow the instruction in [/aws-deploy](https://github.com/nearform/notificami/tree/master/aws-deploy)


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

## License

Copyright nearForm Ltd 2018. Licensed under [Apache 2.0 license][license].

[license]: ./LICENSE.md

