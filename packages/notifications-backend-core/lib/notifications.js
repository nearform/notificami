'use strict'

const NotifmeSdk = require('notifme-sdk').default
const { cloneDeep } = require('lodash')
const EventEmitter = require('events')

const notifmeSdkDefaultConfig = {
  channels: {}
}

module.exports = function buildCommentsService(db, config, strategy = 'default') {
  const notifmeSdkConfig = cloneDeep(notifmeSdkDefaultConfig)

  if (!config.strategies[strategy]) {
    throw new Error(`Cannot initialize the notification service with a non existing strategy (${strategy})`)
  }

  class NotificationsService extends EventEmitter {
    async close() {
      return db.end()
    }

    register(channel, name, handler) {
      if (!channel || !name || !handler) {
        throw new Error('Channel, name and handler parameters are mandatory')
      }

      if (!notifmeSdkConfig.channels[channel]) {
        notifmeSdkConfig.channels[channel] = {}
      }

      notifmeSdkConfig.channels[channel].multiProviderStrategy = 'fallback'

      if (!notifmeSdkConfig.channels[channel].providers) {
        notifmeSdkConfig.channels[channel].providers = []
      }

      notifmeSdkConfig.channels[channel].providers.push({
        type: 'custom',
        id: name,
        send: handler
      })
    }

    async send(notification) {
      if (!this.notifmeSdk) {
        this.notifmeSdk = new NotifmeSdk(notifmeSdkConfig)
      }

      let result
      for (const channel of config.strategies[strategy].channels) {
        if (!notifmeSdkConfig.channels[channel]) continue

        result = await this.notifmeSdk.send({ [channel]: notification })
        if (result.status === 'success') {
          break
        }
      }

      return result
    }

    get config() {
      return cloneDeep(notifmeSdkConfig)
    }
  }

  return new NotificationsService()
}
