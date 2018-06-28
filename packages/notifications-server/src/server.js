'use strict'

const Hapi = require('hapi')
const { defaultConfigBuilder } = require('../default-config-builder')

function registerChannelsAndProviders(notifications, config) {
  if (!config.channels) throw new Error('No channels provided in config')

  Object.keys(config.channels).forEach(channel => {
    Object.keys(config.channels[channel]).forEach(provider => {
      const handler = config.channels[channel][provider]
      notifications.register(channel, provider, handler)
    })
  })
}

async function buildServer(defaultConfig) {
  const server = Hapi.server(defaultConfig.server)
  server.register({
    plugin: require('../../notifications-backend-hapi-plugin/lib/index'),
    options: defaultConfig.pluginOptions
  })

  let config
  if (process.env.NF_NOTIFICATION_CONFIG_BUILDER_PATH) {
    const buildConfig = require(process.env.NF_NOTIFICATION_CONFIG_BUILDER_PATH)

    config = await buildConfig(server)
  } else {
    config = await defaultConfigBuilder(server)
  }

  registerChannelsAndProviders(server.notificationsService, config)

  return server
}

module.exports = {
  registerChannelsAndProviders,
  buildServer
}
