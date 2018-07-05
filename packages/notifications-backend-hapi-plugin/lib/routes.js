'use strict'

const Joi = require('joi')

module.exports = {
  name: 'notifications',
  register(server, options = {}) {
    const { cors = false, auth = false } = options

    server.route({
      method: 'GET',
      path: '/users/{username}/notifications/{offsetId?}',
      handler: async function(request, h) {
        const { username, offsetId } = request.params
        const results = await request.notificationsService.getByUserIdentifier(username, offsetId)
        let hasMore = false
        if (results.length > 0) {
          hasMore = await request.notificationsService.hasMoreByUserIdentifier(username, results[results.length - 1].id)
        }
        return { items: results, hasMore }
      },
      options: {
        cors,
        auth,
        validate: {
          params: {
            username: Joi.string().required(),
            offsetId: Joi.string()
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
      method: 'POST',
      path: '/notifications/{id}/read',
      handler: async function(request, h) {
        const { id } = request.params

        return request.notificationsService.setRead({ id })
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

    server.route({
      method: 'POST',
      path: '/notifications/{id}/unread',
      handler: async function(request, h) {
        const { id } = request.params

        return request.notificationsService.setUnread({ id })
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
