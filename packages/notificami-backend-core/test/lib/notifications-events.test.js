'use strict'

const { expect } = require('code')
const Lab = require('lab')
module.exports.lab = Lab.script()
const { describe, it: test, before, after, afterEach } = module.exports.lab

const { resetDb } = require('../utils')
const config = require('../../config')

const { buildPool, buildNotificationsService, PostgresStorage } = require('../../lib')

describe('Notifications events', () => {
  before(async () => {
    await resetDb()

    const db = buildPool(config.pg)
    this.notificationsService = buildNotificationsService(new PostgresStorage(db), config.notifications)
  })

  after(() => {
    return this.notificationsService.close()
  })

  afterEach(() => {
    this.notificationsService.removeAllListeners('add')
    this.notificationsService.removeAllListeners('read')
    this.notificationsService.removeAllListeners('delete')
    this.notificationsService.removeAllListeners('sent_by')
  })

  describe('adding', () => {
    test('should correctly create a notification', async () => {
      let done
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
      const p = new Promise(resolve => {
        done = resolve
      })

      this.notificationsService.on('add', c => {
        expect(c.id).to.be.number()
        expect(c).to.include(expected)

        done()
      })

      await this.notificationsService.add(notification)
      await p
    })
  })

  describe('setting read', () => {
    test('should correctly set the notification to read', async () => {
      let done

      const notification = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      }

      const p = new Promise(resolve => {
        done = resolve
      })

      this.notificationsService.on('read', c => {
        expect(c.id).to.be.number()
        expect(c.readAt).not.be.null()
        done()
      })

      let result = await this.notificationsService.add(notification)
      await this.notificationsService.setRead({ id: result.id })
      await p
    })
  })

  describe('setting unread', () => {
    test('should correctly set the notification to read', async () => {
      let done

      const notification = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      }

      const p = new Promise(resolve => {
        done = resolve
      })

      this.notificationsService.on('unread', c => {
        expect(c.id).to.be.number()
        expect(c.readAt).to.be.null()
        done()
      })

      let result = await this.notificationsService.add(notification)
      await this.notificationsService.setRead({ id: result.id })
      await this.notificationsService.setUnread({ id: result.id })
      await p
    })
  })

  describe('set deleted', () => {
    test('should correctly set the notification to deleted', async () => {
      let done
      const notification = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      }

      const p = new Promise(resolve => {
        done = resolve
      })

      this.notificationsService.on('delete', c => {
        expect(c.id).to.be.number()
        expect(c.deletedAt).not.be.null()
        done()
      })

      const result = await this.notificationsService.add(notification)
      await this.notificationsService.delete({ id: result.id })
      await p
    })
  })

  describe('sentBy', () => {
    test('should correctly set the notification to be sent by the right channel', async () => {
      let done
      const notification = {
        notify: { user: 'davide', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'davide'
      }

      const p = new Promise(resolve => {
        done = resolve
      })

      this.notificationsService.on('sent_by', c => {
        expect(c.id).to.be.number()
        expect(c.notificationId).to.be.equal(notificationResult.id)
        expect(c.channel).to.be.equal('email')
        expect(c.sentAt).not.be.null()
        done()
      })

      const notificationResult = await this.notificationsService.add(notification)
      await this.notificationsService.sentBy({ id: notificationResult.id, channel: 'email' })
      await p
    })
  })
})
