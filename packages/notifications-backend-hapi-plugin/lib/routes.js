'use strict'

const Joi = require('joi')

module.exports = {
  name: 'notifications',
  register(server, options = {}) {
    const { cors = false, auth = false } = options

    server.route({
      method: 'GET',
      path: '/users/{username}/notifications',
      handler: function(request, h) {
        const { username } = request.params
        return request.notificationsService.getByUserIdentifier(username)
      },
      options: {
        cors,
        auth,
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
        cors,
        auth,
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
        cors,
        auth,
        validate: {
          params: {
            id: Joi.number().required()
          }
        }
      }
    })
  }
}
