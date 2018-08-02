'use strict'

const Joi = require('joi')
const { buildNotificationsService, buildPool, config, PostgresStorage } = require('@nearform/notificami-backend-core')

const schema = Joi.object({
  pg: Joi.object().optional(),
  strategies: Joi.object().optional()
})

const notificationsHapiPlugin = {
  name: '@nearform/notificami-hapi-plugin',
  version: '1.0.0',
  register: async function(server, options = {}) {
    const result = Joi.validate(options, schema, { allowUnknown: true })
    if (result.error) {
      throw result.error
    }

    if (options.storage && options.storage.plugin) {
      try {
        await server.register({ plugin: require(options.storage.plugin), options: options.storage.options || {} })
      } catch (e) {
        server.log(['error', 'initialize-storage', options.storage.plugin], e)
      }
    }

    let db = options.db
    if (!db) {
      db = buildPool(Object.assign({}, config.pg, options.pg))
    }

    const notificationsService = buildNotificationsService(
      server.storageService ? server.storageService : new PostgresStorage(db),
      { strategies: options.strategies }
    )

    server.decorate('server', 'notificationsService', notificationsService)
    server.decorate('request', 'notificationsService', notificationsService)

    if (options.channels) {
      const channels = Object.keys(options.channels)
      for (let index = 0; index < channels.length; index++) {
        const value = options.channels[channels[index]]

        if (value.plugin) {
          try {
            await server.register({ plugin: require(value.plugin), options: value.options || {} })
          } catch (e) {
            server.log(['error', 'initialize-channel', value.plugin], e)
          }
        } else {
          const channel = channels[index]
          const providerNames = Object.keys(value)
          for (let index = 0; index < providerNames.length; index++) {
            await server.notificationsService.register(channel, providerNames[index], value[providerNames[index]])
          }
        }
      }
    }

    if (options.plugins) {
      for (let index = 0; index < options.plugins.length; index++) {
        const value = options.plugins[index]
        try {
          await server.register({ plugin: require(value.plugin), options: value.options || {} })
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
