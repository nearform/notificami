'use strict'

const Hapi = require('hapi')

async function buildServer(defaultConfig) {
  const server = Hapi.server(defaultConfig.server)
  await server.register({
    plugin: require('@nearform/notificami-backend-hapi-plugin'),
    options: defaultConfig.notifications
  })

  return server
}

module.exports = {
  buildServer
}
