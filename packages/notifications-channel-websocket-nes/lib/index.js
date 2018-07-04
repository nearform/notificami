'use strict'

const Nes = require('nes')
const { notifyUser } = require('./subscriptions')

exports.plugin = {
  pkg: require('../package.json'),
  register: async function(server, options) {
    await server.register([
      {
        plugin: Nes,
        options
      }
    ])

    server.method('notificationsChannelWebsocketNesNotifyUser', notifyUser.bind(server))
    server.subscription('/users/{user*}', {
      onSubscribe: async (socket, path, params) => {
        setTimeout(async () => {
          const { user } = params
          const results = await server.notificationsService.getByUserIdentifier(user)
          let hasMore = false
          if (results.length > 0) {
            hasMore = await server.notificationsService.hasMoreByUserIdentifier(user, results[results.length - 1].id)
          }
          await server.publish(`/users/${params.user}`, { type: 'init', payload: { items: results, hasMore } })
        })
      }
    })
    server.notificationsService.register('socket', 'websocket-nes', async notification => {
      return server.methods.notificationsChannelWebsocketNesNotifyUser(notification)
    })
  }
}
