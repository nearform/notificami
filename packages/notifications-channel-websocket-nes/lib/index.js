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
    server.subscription('/users/{user*}')
    server.notificationsService.register('socket', 'websocket-nes', async notification => {
      return server.methods.notificationsChannelWebsocketNesNotifyUser(notification)
    })
  }
}
