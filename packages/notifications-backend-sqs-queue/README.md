# notifications-backend-sqs-queue

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
  handler,
  enableConsumer,
  enableProducer
}
```

The `SQSInstance` should be an instance of the `aws-sdk` SQS module (`new AWS.SQS(...)`).

The `config` object should contain the following properties:

```
{
  SQSQueueURL, // where to reach the SQS service
  SQSQueueName // name of the queue we are publishing to/reading from
}
```

If present, the `handler` property should be a an `asyc` function. This function will be used fro the consumer to handle new messages coming from the SQS service.

The `enableConsumer` property is a flag that if set to `true` will trigger the consumer to start listening to messages from SQS.

The `enableProducer` property is a flag that if set to `true` will trigger the producer to listen to `add` event on the `notificationsService` and will send messages to the queue for each new notification.

**NOTE:** if you omit `enableConsumer` or `enableProducer` you will still find the producer and consumer as properties of the server (`server.sqsConsumer`, `server.sqsProducer`)
