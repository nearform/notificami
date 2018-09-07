'use strict'

const Nes = require('nes')
const { notifyUser } = require('./subscriptions')
const { name, version } = require('../package.json')
const { callbackify } = require('util')

module.exports = {
  register: async function(server, options, next) {
    await server.register([
      {
        register: Nes,
        options
      }
    ])

    server.method('notificationsChannelWebsocketNesNotifyUser', notifyUser.bind(server.root))
    server.subscription('/users/{user*}', {
      onSubscribe: callbackify(async (socket, path, params) => {
        setTimeout(async () => {
          const { user } = params
          const results = await server.notificationsService.getByUserIdentifier(user)
          if (results.hasMore === undefined) {
            results.hasMore = false
            if (results.items.length > 0) {
              results.hasMore = await server.notificationsService.hasMoreByUserIdentifier(
                user,
                results.items[results.items.length - 1].id
              )
            }
          }
          return server.publish(`/users/${params.user}`, {
            type: 'init',
            payload: { items: results.items, hasMore: results.hasMore }
          })
        })
      })
    })

    server.notificationsService.register('socket', 'websocket-nes', async notification => {
      return server.methods.notificationsChannelWebsocketNesNotifyUser(notification)
    })

    return next()
  }
}
module.exports.register.attributes = { name, version }
