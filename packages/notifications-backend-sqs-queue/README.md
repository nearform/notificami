# @nearform/notifications-backend-sqs-queue

This plugin will let you connect to the AWS SQS service.

## Install

```
npm install @nearform/notifications-backend-sqs-queue
```

## Configuration

The configuration expected by the plugin is of the following format

```
{
  SQSInstance,
  config,
  enableConsumer,
  enableProducer
}
```

The `SQSInstance` is optional, if present, it should be an instance of the `aws-sdk` SQS module (`new AWS.SQS(...)`).

The `config` object should contain the following properties:

```
{
  SQSQueueURL, // mandatory, where to reach the SQS service
  SQSQueueName, // madatory, name of the queue we are publishing to/reading from
  aws: {
    // optional, it should contain all the properties to be passed to the aws update function AWS.config.update()
  }
  sqs: {
    // optional, this is the object passed to the AWS.SQS() constrsuctor
  }
}
```

The `enableConsumer` property is a flag that if set to `true` will trigger the consumer to start listening to messages from SQS. For each consumed message the `notificationsService.send` will be called.

The `enableProducer` property is a flag that if set to `true` will trigger the producer to listen to `add` event on the `notificationsService` and will send messages to the queue for each new notification.

**NOTE:** if you omit `enableConsumer` or `enableProducer` you will still find the producer and consumer as properties of the server (`server.sqsConsumer`, `server.sqsProducer`)

## How to use this in the notifications server

After installing the plugin, you can add the following lines to the server configuration:

```
{
  notifications: {
    channels: { ... },
    plugins: [

      // Start: declaring sqs queue plugin
      {
        plugin: '@nearform/notifications-backend-sqs-queue',
        options: {
          config: {
            SQSQueueURL: 'http://localhost:9832',
            SQSQueueName: 'my-notification-queue',
            aws: {
              region: 'eu-west-1'
            },
            sqs: {
              apiVersion: '2012-11-05'
            }
          },
          enableConsumer: true,
          enableProducer: true
        }
      },
      // End: Installing sqs queue plugin

      ...
    ],
    strategies: { ... }
  }
  ...
}
```