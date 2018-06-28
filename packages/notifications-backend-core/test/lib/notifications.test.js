'use strict'

const { expect } = require('code')
const Lab = require('lab')
module.exports.lab = Lab.script()
const { describe, it: test, beforeEach, before, after } = module.exports.lab

const { resetDb } = require('../utils')
const config = require('../../config')

const { buildPool, buildNotificationsService } = require('../../lib')

describe('Notification', () => {
  before(async () => {
    const db = buildPool(config.pg)
    this.notificationsService = buildNotificationsService(db, config.notifications)
  })

  beforeEach(async () => {
    await resetDb()
  })

  after(() => {
    return this.notificationsService.close()
  })

  describe('mappers', () => {
    test('mapNotificationFromDb should return null with null parameters', () => {
      expect(this.notificationsService.mapNotificationFromDb()).to.be.null()
    })

    test('mapSentByFromDb should return null with null parameters', () => {
      expect(this.notificationsService.mapSentByFromDb()).to.be.null()
    })
  })

  describe('adding', () => {
    test('should correctly create a notification', async () => {
      const notification = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      }

      const expected = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide',
        readAt: null,
        deletedAt: null
      }
      const result = await this.notificationsService.add(notification)

      expect(result.id).to.be.number()
      expect(result).to.include(expected)
    })
  })

  describe('get', () => {
    test('should throw an error when a non existing notification is requested', async () => {
      await expect(this.notificationsService.get(-1)).to.reject(Error, 'Cannot find notification with id -1')
    })

    test('should throw an error when a deleted notification is requested', async () => {
      const notification = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      }
      let result = await this.notificationsService.add(notification)
      await this.notificationsService.delete({ id: result.id })
      await expect(this.notificationsService.get(result.id)).to.reject(
        Error,
        `Cannot find notification with id ${result.id}`
      )
    })

    test('should correctly return the notification without sent by', async () => {
      const notification = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      }

      const expected = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide',
        sentBy: [],
        readAt: null,
        deletedAt: null
      }
      let result = await this.notificationsService.add(notification)

      result = await this.notificationsService.get(result.id)

      expect(result.id).to.be.number()
      expect(result).to.include(expected)
    })

    test('should correctly return the notification with sent by', async () => {
      const notification = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      }

      let notificationResult = await this.notificationsService.add(notification)

      const expected = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide',
        readAt: null,
        deletedAt: null
      }

      let result = await this.notificationsService.sentBy({ id: notificationResult.id, channel: 'email' })
      result = await this.notificationsService.get(result.id)

      expect(result.id).to.be.number()
      expect(result).to.include(expected)
      expect(result.sentBy[0]).to.include({
        notification_id: notificationResult.id,
        channel: 'email'
      })
    })
  })

  describe('getByUserIdentifier', () => {
    test('should correctly return the notification list related to the user', async () => {
      await this.notificationsService.add({
        notify: { content: 'Some notification content for Davide' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      })

      await this.notificationsService.add({
        notify: { content: 'a notification for Filippo' },
        sendStrategy: 'default',
        userIdentifier: 'filippo'
      })

      await this.notificationsService.add({
        notify: { content: 'another notification for Davide' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      })

      let result = await this.notificationsService.getByUserIdentifier('davide')
      expect(result.length).to.be.equal(2)
      expect(result[0].notify).to.be.equal({ content: 'Some notification content for Davide' })
      expect(result[1].notify).to.be.equal({ content: 'another notification for Davide' })

      result = await this.notificationsService.getByUserIdentifier('filippo')
      expect(result.length).to.be.equal(1)
      expect(result[0].notify).to.be.equal({ content: 'a notification for Filippo' })

      result = await this.notificationsService.getByUserIdentifier('jack')
      expect(result.length).to.be.equal(0)
    })
  })

  describe('setting read', () => {
    test('should throw an error when a non existing notification is requested', async () => {
      await expect(this.notificationsService.setRead({ id: -1 })).to.reject(
        Error,
        'Cannot find notification with id -1'
      )
    })

    test('should correctly set the notification to read', async () => {
      const notification = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      }

      let result = await this.notificationsService.add(notification)
      expect(result.id).to.be.number()
      result = await this.notificationsService.setRead({ id: result.id })
      expect(result.readAt).not.be.null()
    })
  })

  describe('set deleted', () => {
    test('should throw an error when a non existing notification is requested', async () => {
      await expect(this.notificationsService.delete({ id: -1 })).to.reject(Error, 'Cannot find notification with id -1')
    })

    test('should correctly set the notification to deleted', async () => {
      const notification = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      }

      let result = await this.notificationsService.add(notification)
      expect(result.id).to.be.number()
      result = await this.notificationsService.delete({ id: result.id })
      expect(result.deletedAt).not.be.null()
    })
  })

  describe('sentBy', () => {
    test('should correctly set the notification to deleted', async () => {
      const notification = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      }

      let notificationResult = await this.notificationsService.add(notification)

      let result = await this.notificationsService.sentBy({ id: notificationResult.id, channel: 'email' })

      expect(result.notificationId).to.be.equal(notificationResult.id)
      expect(result.channel).to.be.equal('email')
      expect(result.sentAt).not.be.null()
    })
  })
})
