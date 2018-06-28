'use strict'

async function defaultConfigBuilder(server) {
  return {
    channels: {
      socket: {
        mysocketservice: async notification => {
          const result = await server.notifyViaWebsocket(notification)
          if (result.success === true) {
            server.notificationsService.sentBy({ id: notification.id, channel: 'socket' })
          }
        }
      }
    },
    strategies: {
      default: {
        name: 'default-to-sockets',
        channels: ['socket']
      }
    }
  }
}

module.exports = {
  defaultConfigBuilder
}
