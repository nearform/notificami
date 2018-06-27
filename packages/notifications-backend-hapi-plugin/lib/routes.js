'use strict'

const Joi = require('joi')

module.exports = {
  name: 'notifications',
  register(server, options = {}) {
    options.cors = options.cors || false

    server.route({
      method: 'GET',
      path: '/users/{username}/notifications',
      handler: function(request, h) {
        const { username } = request.params
        return request.notificationsService.getByUserIdentifier(username)
      },
      options: {
        cors: options.cors,
        auth: options.auth || false,
        validate: {
          params: {
            username: Joi.string().required()
          }
        }
      }
    })

    server.route({
      method: 'POST',
      path: '/notifications',
      handler: async function(request, h) {
        return request.notificationsService.add(request.payload)
      },
      options: {
        cors: options.cors,
        auth: options.auth || false,
        validate: {
          payload: {
            notify: Joi.object().required(),
            sendStrategy: Joi.string(),
            userIdentifier: Joi.string().required()
          }
        }
      }
    })

    server.route({
      method: 'DELETE',
      path: '/notifications/{id}',
      handler: async function(request, h) {
        const { id } = request.params

        await request.notificationsService.delete({ id })
        return { success: true }
      },
      options: {
        cors: options.cors,
        auth: options.auth || false,
        validate: {
          params: {
            id: Joi.number().required()
          }
        }
      }
    })
  }
}
