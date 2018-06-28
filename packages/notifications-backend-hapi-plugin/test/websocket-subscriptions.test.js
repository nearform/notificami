'use strict'

const Nes = require('nes')
const { expect } = require('code')
const sinon = require('sinon')
const Lab = require('lab')
module.exports.lab = Lab.script()
const { describe, it: test, before, after, beforeEach } = module.exports.lab

const { resetDb } = require('../../notifications-backend-core/test/utils')
const buildServer = require('./test-server')

describe('Notification Websocket - routes', () => {
  let server = null
  let client = null
  let mockTestService

  before(async () => {
    mockTestService = sinon.stub()
    server = await buildServer(
      {
        host: '127.0.0.1',
        port: 8281,
        pluginOptions: { nes: {} }
      },
      { mockTestService }
    )

    await server.start()
  })

  beforeEach(async () => {
    mockTestService.reset()
    await resetDb()
  })

  after(async () => {
    return server.stop()
  })

  describe('Websocket', () => {
    test('it should be pushed to resource subscribers if the user is connected', async flags => {
      client = new Nes.Client('ws://127.0.0.1:8281')
      await client.connect()

      await new Promise((resolve, reject) => {
        async function handler(event, flags) {
          expect(event.id).to.equal(1)
          expect(event.notify).to.equal({ user: 'davide', content: 'Some notification content' })
          client.disconnect().then(resolve)
        }

        return client.subscribe(`/users/davide`, handler).then(async () => {
          const notification = {
            notify: { user: 'davide', content: 'Some notification content' },
            sendStrategy: 'default',
            userIdentifier: 'davide'
          }
          const addedNotification = await server.notificationsService.add(notification)

          server.notificationsService.send(addedNotification)
        })
      })
    })

    test('it should use another channel if the user is not connected', async flags => {
      client = new Nes.Client('ws://127.0.0.1:8281')
      await client.connect()

      mockTestService.returns(Promise.resolve())

      const notification = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      }
      const addedNotification = await server.notificationsService.add(notification)
      await server.notificationsService.send(addedNotification)

      expect(mockTestService.called).to.be.true()
    })
  })
})