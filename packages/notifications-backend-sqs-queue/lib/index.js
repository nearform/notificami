'use strict'

const AWS = require('aws-sdk')

const Producer = require('./producer')
const Consumer = require('./consumer')

async function register(server, options = {}) {
  if (!options || !options.config) {
    throw new Error('Cannot find configuration for SQS')
  }

  let { SQSInstance, config, handler } = options

  if (!SQSInstance) {
    AWS.config.update(config.aws || {})

    SQSInstance = new AWS.SQS(config.sqs || {})
  }

  if (handler) {
    server.decorate('server', 'sqsConsumer', new Consumer(SQSInstance, config, handler))
  }

  server.decorate('server', 'sqsProducer', new Producer(SQSInstance, config))

  if (handler && options.enableConsumer === true) {
    server.sqsConsumer.consume()
  }

  if (options.enableProducer === true) {
    server.notificationsService.on('add', async notification => {
      await server.sqsProducer.sendToQueue(notification)
    })
  }
}

module.exports = {
  pkg: require('../package.json'),
  register
}
