'use strict'

const NotifmeSdk = require('notifme-sdk').default // This import create a __core-js_shared__ leak in lab
const { cloneDeep, isFunction } = require('lodash')
const EventEmitter = require('events')
const defaultConfig = require('../config')

const notifmeSdkDefaultConfig = {
  channels: {}
}

module.exports = function buildNotificationService(storage, config = {}) {
  if (!config.strategies) {
    config.strategies = defaultConfig.notifications.strategies
  }

  const notifmeSdkConfig = cloneDeep(notifmeSdkDefaultConfig)

  class NotificationsService extends EventEmitter {
    register(channel, name, handler) {
      if (!channel || !name || !handler) {
        throw new Error('Channel, name and handler parameters are mandatory')
      }

      this.notifmeSdk = null
      if (!notifmeSdkConfig.channels[channel]) {
        notifmeSdkConfig.channels[channel] = {}
      }

      notifmeSdkConfig.channels[channel].multiProviderStrategy = 'fallback'

      if (!notifmeSdkConfig.channels[channel].providers) {
        notifmeSdkConfig.channels[channel].providers = []
      }

      if (isFunction(handler)) {
        notifmeSdkConfig.channels[channel].providers.push({
          type: 'custom',
          id: name,
          send: handler
        })

        return
      }

      notifmeSdkConfig.channels[channel].providers.push(Object.assign({}, { type: name }, handler))
    }

    async send(notification, strategy) {
      if (!strategy) {
        strategy = 'default'
      }

      if (!config.strategies[strategy]) {
        return {
          status: 'error',
          message: `Cannot send notification with a non existing strategy (${strategy})`
        }
      }

      if (!config.strategies[strategy].channels) {
        return {
          status: 'error',
          message: `No channel specified for strategy (${strategy})`
        }
      }

      if (!this.notifmeSdk) {
        this.notifmeSdk = new NotifmeSdk(notifmeSdkConfig)
      }

      let result
      for (const channel of config.strategies[strategy].channels) {
        if (!notifmeSdkConfig.channels[channel]) continue

        result = await this.notifmeSdk.send({ [channel]: notification })
        if (result && result.status === 'success' && Object.keys(result.channels).length > 0) {
          const channels = Object.keys(result.channels)
          for (const chan of channels) {
            await this.sentBy({ id: notification.id, channel: chan })
          }

          break
        }
      }

      return result
    }

    get config() {
      return cloneDeep(notifmeSdkConfig)
    }

    async add({ notify, sendStrategy, userIdentifier }) {
      let notification = await storage.add({ notify, sendStrategy, userIdentifier })

      this.emit('add', notification)

      return notification
    }

    async getByUserIdentifier(userIdentifier) {
      return storage.getByUserIdentifier(userIdentifier)
    }

    async get(id) {
      return storage.get(id)
    }

    async setRead({ id }) {
      let notification = await storage.setRead({ id })

      this.emit('read', notification)

      return notification
    }

    async delete({ id }) {
      let notification = await storage.delete({ id })

      this.emit('delete', notification)

      return notification
    }

    async sentBy({ id, channel }) {
      let notification = await storage.sentBy({ id, channel })

      this.emit('sent_by', notification)

      return notification
    }

    async close() {
      return storage.close && storage.close()
    }
  }

  return new NotificationsService()
}
