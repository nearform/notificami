'use strict'

const Joi = require('joi')
const { version } = require('../package.json')

const register = (server, options = {}, next) => {
  const { cors = false, auth = false } = options
  try {
    server.route({
      method: 'GET',
      path: '/users/{username}/notifications/{offsetId?}',
      handler: async function(request, reply, h) {
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
        return reply({ items: results.items, hasMore: results.hasMore })
      },
      config: {
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
      handler: async function(request, reply, h) {
        return reply(request.notificationsService.add(request.payload))
      },
      config: {
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
      method: 'PUT',
      path: '/notifications/{id}/read',
      handler: async function(request, reply, h) {
        const { id } = request.params

        return reply(request.notificationsService.setRead({ id }))
      },
      config: {
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
      method: 'PUT',
      path: '/notifications/{id}/unread',
      handler: async function(request, reply, h) {
        const { id } = request.params

        return reply(request.notificationsService.setUnread({ id }))
      },
      config: {
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
      handler: async function(request, reply, h) {
        const { id } = request.params

        await request.notificationsService.delete({ id })
        return reply({ success: true })
      },
      config: {
        cors,
        auth,
        validate: {
          params: {
            id: Joi.number().required()
          }
        }
      }
    })
    return next()
  } catch (err) {
    return next(err)
  }
}

register.attributes = { name: 'notifications', version }

module.exports = register
