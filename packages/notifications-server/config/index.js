'use strict'

const { NF_NOTIFICATIONS_SERVER_HOST, NF_NOTIFICATIONS_SERVER_PORT } = process.env

const config = {
  server: {
    host: NF_NOTIFICATIONS_SERVER_HOST || 'localhost',
    port: NF_NOTIFICATIONS_SERVER_PORT || 8080
  }
}

module.exports = config
