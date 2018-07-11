'use strict'

const { NF_NOTIFICATIONS_SERVER_HOST, NF_NOTIFICATIONS_SERVER_PORT } = process.env

const config = {
  notifications: {
    channels: {
      socket: {
        plugin: 'notifications-channel-websocket-nes'
      }
    },
    plugins: [
      {
        plugin: 'notifications-backend-sqs-queue',
        options: {
          config: {
            SQSQueueURL: 'https://sqs.eu-west-1.amazonaws.com/382731911776/notifications-dev-queue.fifo',
            SQSQueueName: 'notifications-dev-queue.fifo',
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
      }
    ],
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
