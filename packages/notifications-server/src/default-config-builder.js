'use strict'

async function defaultConfigBuilder(server) {
  return {
    channels: {
      socket: {
        mysocketservice: async notification => {
          const result = await server.notifyViaWebsocket(notification)

          return result
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
