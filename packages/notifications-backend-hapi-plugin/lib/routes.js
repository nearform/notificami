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
        if (results.hasMore === undefined) {
          results.hasMore = false
          if (results.items.length > 0) {
            results.hasMore = await request.notificationsService.hasMoreByUserIdentifier(
              username,
              results.items[results.items.length - 1].id
            )
          }
        }
        return { items: results.items, hasMore: results.hasMore }
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
