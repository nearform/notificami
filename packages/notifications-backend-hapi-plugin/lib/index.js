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

    const db = buildPool(Object.assign({}, config.pg, options.pg))
    const notificationsService = buildNotificationsService(db, { strategies: options.strategies })

    server.decorate('server', 'notificationsService', notificationsService)
    server.decorate('request', 'notificationsService', notificationsService)

    await server.register({ plugin: require('./routes'), options: options.routes })

    server.ext('onPostStop', async () => {
      await notificationsService.close()
    })
  }
}

module.exports = notificationsHapiPlugin
