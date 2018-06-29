'use strict'

const { expect, fail } = require('code')
const Lab = require('lab')
module.exports.lab = Lab.script()
const { describe, it: test } = module.exports.lab

const fakeDbStorage = {
  add: async () => {},
  getByUserIdentifier: async () => {},
  get: async () => {},
  setRead: async () => {},
  delete: async () => {},
  sentBy: async () => {}
}
const notificationsBuilder = require('../../lib/notifications')

describe('Notifications - register sender to channel', () => {
  test('calling register without paramer should throw an error', () => {
    const notifications = notificationsBuilder(fakeDbStorage)

    try {
      notifications.register()
      fail('I should have chatched an error...')
    } catch (e) {
      expect(e.message).equal('Channel, name and handler parameters are mandatory')
    }
  })

  test('registering a sender into a channel should builg the notif.me sdk configuration', () => {
    const notifications = notificationsBuilder(fakeDbStorage)
    expect(notifications.config).equal({
      channels: {}
    })

    notifications.register('email', 'my-sender', async notification => {})
    notifications.register('socket', 'my-second-sender', async notification => {})
    notifications.register('sms', 'my-third-sender', async notification => {})

    expect(notifications.config).to.part.include({
      channels: {
        email: {
          multiProviderStrategy: 'fallback',
          providers: [
            {
              type: 'custom',
              id: 'my-sender'
            }
          ]
        },
        socket: {
          multiProviderStrategy: 'fallback',
          providers: [
            {
              type: 'custom',
              id: 'my-second-sender'
            }
          ]
        },
        sms: {
          multiProviderStrategy: 'fallback',
          providers: [
            {
              type: 'custom',
              id: 'my-third-sender'
            }
          ]
        }
      }
    })

    expect(notifications.config.channels).to.be.an.object()
    expect(notifications.config.channels.email).to.be.an.object()
    expect(notifications.config.channels.email.multiProviderStrategy).equal('fallback')
    expect(notifications.config.channels.email.providers).to.be.an.array()
    expect(notifications.config.channels.email.providers.length).equal(1)
    expect(notifications.config.channels.email.providers[0]).to.be.an.object()
    expect(notifications.config.channels.email.providers[0]).to.include({
      id: 'my-sender',
      type: 'custom'
    })
    expect(notifications.config.channels.email.providers[0].send).to.be.a.function()
  })

  test('registering a sender (object or function) into a channel should build the notif.me sdk configuration', () => {
    const notifications = notificationsBuilder(fakeDbStorage)
    notifications.register('email', 'smtp', { key: 1234, from: 'me@examepl.com' })
    notifications.register('email', 'somthing-elser-smtp', { type: 'smtp', key: 'abcd', from: 'me@examepl.com' })
    notifications.register('email', 'my-sender-2', async notification => {})
    notifications.register('sms', 'my-third-sender', async notification => {})

    expect(notifications.config).to.part.include({
      channels: {
        email: {
          multiProviderStrategy: 'fallback',
          providers: [
            {
              type: 'smtp',
              key: 1234,
              from: 'me@examepl.com'
            },
            {
              type: 'smtp',
              key: 'abcd',
              from: 'me@examepl.com'
            },
            {
              type: 'custom',
              id: 'my-sender-2'
            }
          ]
        },
        sms: {
          multiProviderStrategy: 'fallback',
          providers: [
            {
              type: 'custom',
              id: 'my-third-sender'
            }
          ]
        }
      }
    })
  })

  test('registering a sender should enable sending of notification', async () => {
    const notifications = notificationsBuilder(fakeDbStorage)
    const notification = { id: 'my-notification' }

    notifications.register('email', 'my-email-sender', async notification => {
      return 'id-email-sent'
    })

    const result = await notifications.send(notification)
    expect(result).equal({
      status: 'success',
      channels: {
        email: {
          id: 'id-email-sent',
          providerId: 'my-email-sender'
        }
      }
    })
  })

  test('calling send with a non existing strategy will return an error', async () => {
    const notifications = notificationsBuilder(fakeDbStorage)
    const notification = { id: 'my-notification' }

    notifications.register('email', 'my-email-sender', async notification => {
      return 'id-email-sent'
    })

    const result = await notifications.send(notification, 'no-strategy')
    expect(result).equal({
      status: 'error',
      message: 'Cannot send notification with a non existing strategy (no-strategy)'
    })
  })

  test('the first sender in the strategy configsender will be used', async () => {
    const notifications = notificationsBuilder(fakeDbStorage)
    const notification = { id: 'my-notification' }

    notifications.register('socket', 'my-socket-sender', async notification => {
      return 'id-socket-sent'
    })

    notifications.register('email', 'my-email-sender', async notification => {
      return 'id-email-sent'
    })

    const result = await notifications.send(notification)
    expect(result).equal({
      channels: {
        socket: {
          id: 'id-socket-sent',
          providerId: 'my-socket-sender'
        }
      },
      status: 'success'
    })
  })
})
