'use strict'

const { NF_NOTIFICATIONS_SERVER_HOST, NF_NOTIFICATIONS_SERVER_PORT } = process.env

const awsStack = require(process.env.DDB_STACK_PATH)

const config = {
  notifications: {
    channels: {
      socket: {
        plugin: '@nearform/notificami-channel-websocket-nes'
      }
    },
    plugins: [
      {
        plugin: '@nearform/notificami-backend-sqs-queue',
        options: {
          config: {
            SQSQueueURL: awsStack.SQSQueueURL,
            SQSQueueName: awsStack.SQSQueueName,
            aws: {
              region: awsStack.Region
            }
          },
          enableConsumer: true,
          enableProducer: true
        }
      }
    ],
    storage: { plugin: '@nearform/notificami-storage-dynamodb', options: awsStack },
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
