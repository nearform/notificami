'use strict'

function registerChannelsAndProviders(notifications, config) {
  if (!config.channels) throw new Error('No channels provided in config')

  Object.keys(config.channels).forEach(channel => {
    Object.keys(config.channels[channel]).forEach(provider => {
      const handler = config.channels[channel][provider]
      notifications.register(channel, provider, handler)
    })
  })
}

async function defaultConfigBuilder(server, mockTestService) {
  return {
    channels: {
      socket: {
        mysocketservice: async notification => {
          return server.notifyViaWebsocket(notification)
        }
      },
      test: {
        testService: mockTestService
      }
    },
    strategies: {
      default: {
        name: 'default-to-sockets',
        channels: ['socket', 'test']
      }
    }
  }
}

module.exports = async function buildServer(config = {}, options = {}) {
  // If forked as child, send output message via ipc to parent, otherwise output to console
  const logMessage = process.send ? process.send : console.log // eslint-disable-line no-console

  try {
    const server = require('hapi').Server({
      host: config.host || '127.0.0.1',
      port: config.port || 8080
    })

    if (!config.pluginOptions) {
      config.pluginOptions = {
        strategies: {
          default: {}
        }
      }
    }

    if (!config.pluginOptions.resolvers) {
      config.pluginOptions.resolvers = {
        resolveUrl: () => 'http://localhost/'
      }
    }

    let channelConfig
    if (config.buildConfig) {
      channelConfig = await config.buildConfig(server)
    } else {
      channelConfig = await defaultConfigBuilder(server, options.mockTestService || (() => {}))
    }

    await server.register({
      plugin: require('../lib/index'),
      options: Object.assign({}, config.pluginOptions, { strategies: channelConfig.strategies })
    })

    registerChannelsAndProviders(server.notificationsService, channelConfig)

    return server
  } catch (err) {
    logMessage(`Failed to build server: ${err.message}`)
    process.exit(1)
  }
}
