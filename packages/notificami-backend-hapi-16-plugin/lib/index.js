'use strict'

const Joi = require('joi')
const { name, version } = require('../package.json')
const { buildNotificationsService, buildPool, config, PostgresStorage } = require('@nearform/notificami-backend-core')

const schema = Joi.object({
  pg: Joi.object().optional(),
  strategies: Joi.object().optional()
})

const notificationsHapiPlugin = async function(server, options = {}, next) {
  try {
    const result = Joi.validate(options, schema, { allowUnknown: true })
    if (result.error) {
      throw result.error
    }
    if (options.storage && options.storage.plugin) {
      server.log(name, ['use storage plugin', options.storage.plugin])
      try {
        await server.register({ register: require(options.storage.plugin), options: options.storage.options || {} })
      } catch (e) {
        server.log(['error', name, 'initialize-storage', options.storage.plugin], e)
      }
    }
    let db = options.db
    if (!db) {
      const dbConfig = Object.assign({}, config.pg, options.pg)
      server.log(name, [`use db configuration to store notifications`, dbConfig])
      db = buildPool(dbConfig)
    }

    let { storageService } = server
    if (!storageService) {
      storageService = new PostgresStorage(db)
      server.log(name, `use default PostgresStorage to store notifications in db "${db.options.database}"`)
    }

    const notificationsService = buildNotificationsService(storageService, { strategies: options.strategies })

    server.decorate('server', 'notificationsService', notificationsService)
    server.decorate('request', 'notificationsService', notificationsService)
    if (options.channels) {
      server.log(name, ['use channels', options.channels])
      const channels = Object.keys(options.channels)
      for (let index = 0; index < channels.length; index++) {
        const value = options.channels[channels[index]]
        if (value.plugin) {
          try {
            await server.register({ register: require(value.plugin), options: value.options || {} })
          } catch (e) {
            server.log(['error', name, 'initialize-channel', value.plugin], e)
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
      server.log(name, ['use plugins', options.plugins])
      for (let index = 0; index < options.plugins.length; index++) {
        const value = options.plugins[index]
        try {
          await server.register({ register: require(value.plugin), options: value.options || {} })
        } catch (e) {
          server.log(['error', 'initialize-plugin', value.plugin], e)
        }
      }
    }

    await server.register({ register: require('./routes'), options: options.routes })
    server.ext('onPostStop', async () => {
      await notificationsService.close()
    })
    return next()
  } catch (e) {
    return next(e)
  }
}

notificationsHapiPlugin.attributes = { name, version }

module.exports = notificationsHapiPlugin
