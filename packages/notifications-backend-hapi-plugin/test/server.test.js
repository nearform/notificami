'use strict'

const { expect } = require('code')
const Lab = require('lab')

module.exports.lab = Lab.script()
const { describe, it: test, before, beforeEach, after } = module.exports.lab

const { resetDb } = require('../../notifications-backend-core/test/utils')
const buildServer = require('./test-server')

describe('Notifications REST API', () => {
  let server = null

  before(async () => {
    server = await buildServer()
  })

  beforeEach(async () => {
    await resetDb()
  })

  after(async () => {
    return server.stop()
  })

  describe('GET /users/{userIdentifier}/notifications', () => {
    test('it should get the list related to the user', async () => {
      await server.notificationsService.add({
        notify: { content: 'Some notification content for Davide' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      })

      await server.notificationsService.add({
        notify: { content: 'a notification for Filippo' },
        sendStrategy: 'default',
        userIdentifier: 'filippo'
      })

      await server.notificationsService.add({
        notify: { content: 'another notification for Davide' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      })

      const response = await server.inject({
        method: 'GET',
        url: `/users/davide/notifications`
      })

      expect(response.statusCode).to.equal(200)
      const result = JSON.parse(response.payload)

      expect(result.length).to.be.equal(2)
      expect(result[0].notify).to.be.equal({ content: 'Some notification content for Davide' })
      expect(result[1].notify).to.be.equal({ content: 'another notification for Davide' })
    })
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
    })
  })

  describe('DELETE /notifications/{id}', () => {
    test('it should delete a notification', async () => {
      const created = await server.notificationsService.add({
        notify: { content: 'Some notification content for Davide' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      })

      const response = await server.inject({
        method: 'DELETE',
        url: `/notifications/${created.id}`
      })

      expect(response.statusCode).to.equal(200)
      const result = JSON.parse(response.payload)

      expect(result).to.equal({ success: true })
    })
  })
})
