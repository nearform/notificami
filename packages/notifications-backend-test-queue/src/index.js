'use strict'

const { TestQueue } = require('./test-queue')

async function register(server, options = {}) {
  const queue = new TestQueue()
  queue.consume('notification-queue', async notification => {
    try {
      await server.notificationsService.send(notification, notification.sendStrategy)
    } catch (e) {
      server.log(['error', 'notification', 'send'], e)
    }
  })

  server.notificationsService.on('add', async notification => {
    await queue.sendToQueue('notification-queue', notification)
  })
}

module.exports = {
  pkg: require('../package.json'),
  register
}
