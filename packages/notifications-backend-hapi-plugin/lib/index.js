'use strict'

const Joi = require('joi')
const { buildNotificationsService, buildPool, config } = require('notifications-backend-core')

const { TestQueue } = require('./test-queue')

const schema = Joi.object({
  pg: Joi.object().optional(),
  strategies: Joi.object().optional()
})

const notificationsHapiPlugin = {
  name: 'notifications-hapi-plugin',
  version: '1.0.0',
  register: async function(server, options = {}) {
    const result = Joi.validate(options, schema, { allowUnknown: true })
    if (result.error) {
      throw result.error
    }

    let db = options.db
    if (!db) {
      db = buildPool(Object.assign({}, config.pg, options.pg))
    }
    const notificationsService = buildNotificationsService(db, { strategies: options.strategies })

    server.decorate('server', 'notificationsService', notificationsService)
    server.decorate('request', 'notificationsService', notificationsService)

    if (options.channels) {
      Object.entries(options.channels).map(async ([key, value]) => {
        try {
          await server.register(require(value.plugin), value.options || {})
        } catch (e) {
          server.log(['error', 'initialize-plugin', value.plugin], e)
        }
      })
    }

    const queue = new TestQueue()
    queue.consume('notification-queue', async notification => {
      try {
        await notificationsService.send(notification, notification.sendStrategy)
      } catch (e) {
        server.log(['error', 'notification', 'send'], e)
      }
    })

    notificationsService.on('add', async notification => {
      await queue.sendToQueue('notification-queue', notification)
    })

    await server.register({ plugin: require('./routes'), options: options.routes })

    server.ext('onPostStop', async () => {
      await notificationsService.close()
    })
  }
}

module.exports = notificationsHapiPlugin
