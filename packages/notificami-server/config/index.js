'use strict'

const { NF_NOTIFICATIONS_SERVER_HOST, NF_NOTIFICATIONS_SERVER_PORT } = process.env

const config = {
  notifications: {
    channels: {
      socket: {
        plugin: '@nearform/notificami-channel-websocket-nes'
      }
    },
    plugins: [{ plugin: '@nearform/notificami-backend-local-queue' }],
    strategies: {
      default: {
        name: 'default-to-sockets',
        channels: ['socket']
      }
    }
  },
  server: {
    host: NF_NOTIFICATIONS_SERVER_HOST || 'localhost',
    port: NF_NOTIFICATIONS_SERVER_PORT || 8482
  }
}

module.exports = config
