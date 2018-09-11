'use strict'

const Nes = require('nes')
const { expect } = require('code')
const sinon = require('sinon')
const Lab = require('lab')
const { promisify } = require('util')

module.exports.lab = Lab.script()
const { describe, it, before, after, beforeEach } = module.exports.lab

const { resetDb } = require('@nearform/notificami-backend-core/test/utils')
const buildServer = require('./test-server')

const delay = (ms = 10) => new Promise(resolve => setTimeout(resolve, ms))

describe('Notification Websocket - routes', () => {
  let server = null
  let client = null
  let port = null
  let mockTestService

  before(async () => {
    mockTestService = sinon.stub()
    server = await buildServer(
      {
        host: '127.0.0.1',
        port: 0,
        pluginOptions: {
          channels: {
            socket: {
              plugin: '@nearform/notificami-channel-websocket-nes-6-hapi-16',
              options: { heartbeat: false }
            }
          },
          plugins: [{ plugin: '@nearform/notificami-backend-local-queue' }],
          strategies: {
            default: {
              name: 'default-to-sockets',
              channels: ['socket', 'test']
            }
          }
        }
      },
      { mockTestService }
    )
    port = server.info.port
    global.console.log('WS test port :', port)
    await server.start()
  })

  beforeEach(async () => {
    mockTestService.reset()
    await resetDb()
  })

  after(() => {
    server.stop()
  })

  describe('Websocket', done => {
    it('should be pushed to resource subscribers if the user is connected', async flags => {
      return new Promise(async (resolve, reject) => {
        client = new Nes.Client(`ws://127.0.0.1:${port}`)
        await promisify(client.connect.bind(client))({})

        await server.notificationsService.add({
          notify: { user: 'davide', content: 'Some initial notification' },
          sendStrategy: 'default',
          userIdentifier: 'davide'
        })
        await delay(1000)
        global.console.warn('⚠️ This test should display an error "Error: User not subscribed"')

        let hasInit = false
        let hasNew = false
        promisify(client.subscribe.bind(client))(`/users/davide`, async ({ payload, type }, flags) => {
          if (type === 'init') {
            hasInit = true
            expect(payload.hasMore).to.be.false()
            expect(payload.items[payload.items.length - 1].notify).to.be.equal({
              content: 'Some initial notification',
              user: 'davide'
            })
          } else {
            hasNew = true
            expect(payload.notify).to.equal({ user: 'davide', content: 'Some notification content' })
          }
          if (hasNew && hasInit) {
            await promisify(client.disconnect.bind(client))()
            resolve()
          }
        })

        const addedNotification = await server.notificationsService.add({
          notify: { user: 'davide', content: 'Some notification content' },
          sendStrategy: 'default',
          userIdentifier: 'davide'
        })

        await delay(1000)
        await server.notificationsService.send(addedNotification)
      })
    })

    it('should use another channel if the user is not connected', async flags => {
      client = new Nes.Client(`ws://127.0.0.1:${port}`)
      await promisify(client.connect.bind(client))({})

      mockTestService.returns(Promise.resolve())

      const notification = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      }
      const addedNotification = await server.notificationsService.add(notification)
      server.notificationsService.notifmeSdk.logger.mute()
      await server.notificationsService.send(addedNotification)

      expect(mockTestService.called).to.be.true()
    })
  })
})
