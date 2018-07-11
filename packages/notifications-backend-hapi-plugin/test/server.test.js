'use strict'

const { expect } = require('code')
const Lab = require('lab')

module.exports.lab = Lab.script()
const { describe, it: test, before, beforeEach, after } = module.exports.lab

const { resetDb } = require('../../notifications-backend-core/test/utils')
const buildServer = require('./test-server')
const notificationsMockData = require('./__mockData__/notifications')

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
    beforeEach(async () => {
      for (let { notify, sendStrategy, userIdentifier } of notificationsMockData) {
        await server.notificationsService.add({
          notify,
          sendStrategy,
          userIdentifier
        })
      }
    })

    test('it should get the list related to the user from the top', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/users/davide/notifications`
      })

      expect(response.statusCode).to.equal(200)
      const { items, hasMore } = JSON.parse(response.payload)

      expect(items.length).to.be.equal(5)
      expect(items[0].notify.content).to.be.equal('Some notification content 9')
      expect(items[1].notify.content).to.be.equal('Some notification content 8')
      expect(items[2].notify.content).to.be.equal('Some notification content 7')
      expect(items[3].notify.content).to.be.equal('Some notification content 6')
      expect(items[4].notify.content).to.be.equal('Some notification content 5')
      expect(hasMore).to.be.true()
    })

    test('it should get the list related to the user from a specific ID', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/users/davide/notifications/5`
      })

      expect(response.statusCode).to.equal(200)
      const { items, hasMore } = JSON.parse(response.payload)

      expect(items.length).to.be.equal(4)
      expect(items[0].notify.content).to.be.equal('Some notification content 4')
      expect(items[1].notify.content).to.be.equal('Some notification content 3')
      expect(items[2].notify.content).to.be.equal('Some notification content 2')
      expect(items[3].notify.content).to.be.equal('Some notification content 1')
      expect(hasMore).to.be.false()
    })

    test('it should get the list related to the user from a specific ID without any results', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/users/filippo/notifications/5`
      })

      expect(response.statusCode).to.equal(200)
      const { items, hasMore } = JSON.parse(response.payload)

      expect(items.length).to.be.equal(0)
      expect(hasMore).to.be.false()
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

  describe('PUT /notifications/{id}/read', () => {
    test('it should set a notification to read', async () => {
      const created = await server.notificationsService.add({
        notify: { content: 'Some notification content for Davide' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      })

      const response = await server.inject({
        method: 'PUT',
        url: `/notifications/${created.id}/read`
      })

      expect(response.statusCode).to.equal(200)
      const result = JSON.parse(response.payload)
      expect(result.readAt).not.be.null()
    })
  })

  describe('PUT /notifications/{id}/unread', () => {
    test('it should set a notification to unread', async () => {
      const created = await server.notificationsService.add({
        notify: { content: 'Some notification content for Davide' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      })

      await server.inject({
        method: 'PUT',
        url: `/notifications/${created.id}/read`
      })

      const response = await server.inject({
        method: 'PUT',
        url: `/notifications/${created.id}/unread`
      })

      expect(response.statusCode).to.equal(200)
      const result = JSON.parse(response.payload)
      expect(result.readAt).to.be.null()
    })
  })
})
