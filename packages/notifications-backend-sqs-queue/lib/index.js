'use strict'

const Producer = require('./producer')
const Consumer = require('./consumer')

async function register(server, options = {}) {
  if (!options || !options.SQSInstance || !options.config) {
    throw new Error('Cannot find configuration for SQS')
  }

  const { SQSInstance, config, handler } = options

  if (handler) {
    server.decorate('server', 'sqsConsumer', new Consumer(SQSInstance, config, handler))
  }

  server.decorate('server', 'sqsProducer', new Producer(SQSInstance, config))
}

module.exports = {
  pkg: require('../package.json'),
  register
}
