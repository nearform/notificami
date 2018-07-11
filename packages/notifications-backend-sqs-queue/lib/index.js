'use strict'

const AWS = require('aws-sdk')

const Producer = require('./producer')
const Consumer = require('./consumer')

async function register(server, options = {}) {
  if (!options || !options.config) {
    throw new Error('Cannot find configuration for SQS')
  }

  let { SQSInstance, config } = options

  if (!SQSInstance) {
    AWS.config.update(config.aws || {})

    SQSInstance = new AWS.SQS(Object.assign({}, config.sqs || {}, { apiVersion: '2012-11-05' }))
  }

  server.decorate(
    'server',
    'sqsConsumer',
    new Consumer(SQSInstance, config, async (err, message, done) => {
      if (err) {
        return server.log(['error', 'sqsConsumer', 'parsing'], err)
      }

      let notification
      try {
        notification = JSON.parse(message.Body)
      } catch (e) {
        server.log(['error', 'sqsConsumer', 'parsing'], e)
        return
      }

      const result = await server.notificationsService.send(notification, notification.sendStrategy)
      if (result.status === 'error') {
        return done('error')
      }

      done()
    })
  )
  server.decorate('server', 'sqsProducer', new Producer(SQSInstance, config))

  if (options.enableConsumer === true) {
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
