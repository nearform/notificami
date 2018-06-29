'use strict'

const Joi = require('joi')
const { buildNotificationsService, buildPool, config } = require('notifications-backend-core')

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

    await server.register([
      { plugin: require('notifications-backend-test-queue') },
      { plugin: require('./routes'), options: options.routes }
    ])

    server.ext('onPostStop', async () => {
      await notificationsService.close()
    })
  }
}

module.exports = notificationsHapiPlugin
