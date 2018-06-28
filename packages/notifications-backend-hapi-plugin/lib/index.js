'use strict'

const Joi = require('joi')
const Nes = require('nes')
const { buildNotificationsService, buildPool, config } = require('notifications-backend-core')
const { notifyUser } = require('./subscriptions')
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

    const db = buildPool(Object.assign({}, config.pg, options.pg))
    const notificationsService = buildNotificationsService(db, { strategies: options.strategies })

    server.decorate('server', 'notificationsService', notificationsService)
    server.decorate('request', 'notificationsService', notificationsService)

    if (options.nes) {
      await server.register([
        {
          plugin: Nes,
          options: options.nes
        }
      ])

      server.decorate('server', 'notifyViaWebsocket', notification => {
        return server.methods.notifyUser(notification)
      })
      server.subscription('/users/{user*}')
      server.method('notifyUser', notifyUser.bind(server))

      const queue = new TestQueue()
      queue.consume('notification-queue', async notification => {
        let result
        try {
          result = await notificationsService.send(notification, notification.sendStrategy)
        } catch (e) {
          server.log(['error', 'notification', 'send'], e)
        }

        if (result.status === 'success' && Object.keys(result.channels).length > 0) {
          const tasks = Object.keys(result.channels).map(channel =>
            notificationsService.sentBy({ id: notification.id, channel })
          )

          await Promise.all(tasks)
        }
      })

      notificationsService.on('add', async notification => {
        await queue.sendToQueue('notification-queue', notification)
      })
    }

    await server.register({ plugin: require('./routes'), options: options.routes })

    server.ext('onPostStop', async () => {
      await notificationsService.close()
    })
  }
}

module.exports = notificationsHapiPlugin
