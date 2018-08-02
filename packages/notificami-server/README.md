# @nearform/notificami-server

`@nearform/notificami-server` is a ready to use [Hapi][hapi] server with the `@nearform/notificami-backend-hapi-plugin` registered.

## Install

To install via npm:

```
npm install @nearform/notificami-server
```

## Configuration

You can use the following env variables to configure the server:

```
## server specific variables
NF_NOTIFICATION_CONFIG_PATH
NF_NOTIFICATIONS_SERVER_HOST
NF_NOTIFICATIONS_SERVER_PORT

# DyanamoDb Storage specific variables
DDB_STACK_PATH
```

By default the configuration of the server is for running locally using the config in `config/index.js`

```
const { NF_NOTIFICATIONS_SERVER_HOST, NF_NOTIFICATIONS_SERVER_PORT } = process.env

const config = {
  notifications: {
    channels: {
      socket: {
        plugin: '@nearform/notificami-channel-websocket-nes'
      }
    },
    plugins: [{ plugin: '@nearform/notificami-backend-local-queue' }],
    strategies: {
      default: {
        name: 'default-to-sockets',
        channels: ['socket']
      }
    }
  },
  server: {
    host: NF_NOTIFICATIONS_SERVER_HOST || 'localhost',
    port: NF_NOTIFICATIONS_SERVER_PORT || 8482
  }
}

module.exports = config
```

A ready to use version that works with DynamoDB and AWS SQS is available in `config/aws-config.js` and can be run using:

```
NF_NOTIFICATION_CONFIG_PATH=./config/aws-config.js DDB_STACK_PATH=\"pathToAwsConfig/stack.json\" node index.js
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

## License

Copyright nearForm Ltd 2018. Licensed under [Apache 2.0 license][license].

[license]: ./LICENSE.md
