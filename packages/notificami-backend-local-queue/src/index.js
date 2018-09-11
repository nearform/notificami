'use strict'

const { LocalQueue } = require('./local-queue')
const pkg = require('../package.json')

const { name, version } = pkg

async function register(server, options = {}, next /* hapi 16.x compat */) {
  try {
    const queue = new LocalQueue()
    queue.consume('notification-queue', async notification => {
      try {
        await server.notificationsService.send(notification, notification.sendStrategy)
      } catch (e) {
        server.log(['error', pkg.name, 'notification', 'send'], `${e.msg}:\n${e.stack}`)
      }
    })

    server.notificationsService.on('add', async notification => {
      await queue.sendToQueue('notification-queue', notification)
    })

    if (next && typeof next === 'function') {
      return next()
    }
  } catch (err) {
    return next(err)
  }
}

register.attributes = { name, version }

module.exports = {
  pkg,
  register
}
