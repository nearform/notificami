'use strict'

const Joi = require('joi')
const Nes = require('nes')
const { buildNotificationsService, buildPool, config } = require('notifications-backend-core')
const { notifyUser } = require('./subscriptions')

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
    }

    await server.register({ plugin: require('./routes'), options: options.routes })

    server.ext('onPostStop', async () => {
      await notificationsService.close()
    })
  }
}

module.exports = notificationsHapiPlugin
