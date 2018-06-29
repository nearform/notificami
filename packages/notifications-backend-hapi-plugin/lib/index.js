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
      const channels = Object.keys(options.channels)
      for (let index = 0; index < channels.length; index++) {
        const value = options.channels[channels[index]]
        try {
          await server.register(require(value.plugin), value.options || {})
        } catch (e) {
          server.log(['error', 'initialize-channel', value.plugin], e)
        }
      }
    }

    if (options.plugins) {
      for (let index = 0; index < options.plugins.length; index++) {
        const value = options.plugins[index]
        try {
          await server.register(require(value.plugin), value.options || {})
        } catch (e) {
          server.log(['error', 'initialize-plugin', value.plugin], e)
        }
      }
    }

    await server.register([{ plugin: require('./routes'), options: options.routes }])

    server.ext('onPostStop', async () => {
      await notificationsService.close()
    })
  }
}

module.exports = notificationsHapiPlugin
