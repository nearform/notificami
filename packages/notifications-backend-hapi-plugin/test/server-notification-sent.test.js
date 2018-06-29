'use strict'

const { expect } = require('code')
const Lab = require('lab')

module.exports.lab = Lab.script()
const { describe, it: test, before, beforeEach, after } = module.exports.lab

const { resetDb, loadDataFromTable } = require('../../notifications-backend-core/test/utils')
const buildServer = require('./test-server')

describe('Notifications REST API', () => {
  let server = null

  before(async () => {
    server = await buildServer({
      host: '127.0.0.1',
      port: 8281,
      pluginOptions: {
        strategies: {
          default: {
            name: 'default-to-sockets',
            channels: ['test']
          }
        }
      }
    })
  })

  beforeEach(async () => {
    await resetDb()
  })

  after(async () => {
    return server.stop()
  })

  describe('POST /notifications', () => {
    test('it should create a notification', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/notifications',
        payload: {
          notify: { username: 'davide', message: 'some message here' },
          userIdentifier: 'davide'
        }
      })

      expect(response.statusCode).to.equal(200)
      const result = JSON.parse(response.payload)

      expect(result).to.include({
        notify: { username: 'davide', message: 'some message here' },
        readAt: null,
        deletedAt: null,
        sendStrategy: null,
        sentBy: [],
        userIdentifier: 'davide'
      })

      const sentByRecords = await loadDataFromTable('sent_by')
      expect(sentByRecords.length).to.equal(1)
      expect(sentByRecords[0]).to.include({
        notification_id: 1,
        channel: 'test'
      })
    })
  })
})
