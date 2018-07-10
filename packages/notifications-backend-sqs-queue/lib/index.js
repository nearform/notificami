'use strict'

// const producer = require('./producer')
// const consumer = require('./consumer')

async function register(server, options = {}) {
  // TO DO ...
  // consumer.consume(options.queueName, async notification => {
  //   try {
  //     await server.notificationsService.send(notification, notification.sendStrategy)
  //   } catch (e) {
  //     server.log(['error', 'notification', 'send'], e)
  //   }
  // })
  // server.notificationsService.on('add', async notification => {
  //   await producer.sendToQueue(options.queueName, notification)
  // })
}

module.exports = {
  pkg: require('../package.json'),
  register
}
