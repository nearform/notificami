'use strict'

const { expect } = require('code')
const Lab = require('lab')
module.exports.lab = Lab.script()

const { prepareDDB, resetDb, getStack } = require('./buildserver')

const { describe, it: test, before, after } = module.exports.lab
const { buildNotificationsService } = require('notifications-backend-core')

const notificationsMockData = require('./__mockData__/notifications')
const config = {
  notifications: {
    strategies: {
      default: {
        name: 'list-with-fallback',
        channels: ['socket']
      }
    }
  }
}

const DynamoDbStorage = require('../../lib')

describe('Notification', () => {
  const notificationList = []
  before({ timeout: process.env.CI ? 100000 : 20000 }, async () => {
    const awsStack = getStack()
    const dynamoDb = await prepareDDB(awsStack)
    await resetDb(dynamoDb, awsStack)

    this.notificationsService = buildNotificationsService(
      new DynamoDbStorage(dynamoDb, { TableName: awsStack.TableName }),
      config.notifications
    )

    const storage = new DynamoDbStorage(dynamoDb, { TableName: awsStack.TableName })
    for (let notification of notificationsMockData) {
      const result = await storage.add(notification)
      notificationList.push(result)
    }
  })

  after(async () => {
    await this.notificationsService.close()
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
        readAt: null
      }
      const result = await this.notificationsService.add(notification)

      expect(result.id).to.be.string()
      expect(result).to.include(expected)
    })
  })

  describe('get', () => {
    test('should throw an error when a non existing notification is requested', async () => {
      await expect(this.notificationsService.get('nonexistentid')).to.reject(
        Error,
        'Cannot find notification with id nonexistentid'
      )
    })

    test('should throw an error when a deleted notification is requested', async () => {
      const notification = {
        notify: { user: 'additionaluser', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'additionaluser'
      }
      let result = await this.notificationsService.add(notification)
      await this.notificationsService.delete({ id: result.id })
      await expect(this.notificationsService.get(result.id)).to.reject(
        Error,
        `Cannot find notification with id ${result.id}`
      )
    })

    test('should correctly return the notification without sent by', async () => {
      const result = await this.notificationsService.get(notificationList[0].id)
      expect(result.id).to.be.equal(notificationList[0].id)
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
        readAt: null
      }

      let result = await this.notificationsService.sentBy({ id: notificationResult.id, channel: 'email' })
      result = await this.notificationsService.get(result.id)

      expect(result).to.include(expected)
      expect(result.sentBy[0]).to.include({
        channel: 'email'
      })
    })
  })

  describe('setting read', () => {
    test('should throw an error when a non existing notification is requested', async () => {
      await expect(this.notificationsService.setRead({ id: 'somenonexistentid' })).to.reject(
        Error,
        'Cannot find notification with id somenonexistentid'
      )
    })

    test('should correctly set the notification to read', async () => {
      const notification = {
        notify: { user: 'setreaduser', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'setreaduser'
      }

      let result = await this.notificationsService.add(notification)
      result = await this.notificationsService.setRead({ id: result.id })
      expect(result.readAt).not.be.null()
    })
  })

  describe('setting unread', () => {
    test('should throw an error when a non existing notification is requested', async () => {
      await expect(this.notificationsService.setUnread({ id: 'somenonexistentid' })).to.reject(
        Error,
        'Cannot find notification with id somenonexistentid'
      )
    })

    test('should correctly set the notification to read', async () => {
      const notification = {
        notify: { user: 'setunreaduser', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'setunreaduser'
      }

      let result = await this.notificationsService.add(notification)
      result = await this.notificationsService.setRead({ id: result.id })
      expect(result.readAt).not.be.null()
      result = await this.notificationsService.setUnread({ id: result.id })
      expect(result.readAt).to.be.null()
    })
  })

  describe('set deleted', () => {
    test('should throw an error when a non existing notification is requested', async () => {
      await expect(this.notificationsService.delete({ id: 'somenonexistentid' })).to.reject(
        Error,
        'Cannot find notification with id somenonexistentid'
      )
    })

    test('should correctly set the notification to deleted', async () => {
      const notification = {
        notify: { user: 'deletetestuser', content: 'Some notification content' },
        sendStrategy: 'default',
        userIdentifier: 'deletetestuser'
      }

      let result = await this.notificationsService.add(notification)
      const deletedItem = await this.notificationsService.delete({ id: result.id })
      expect(deletedItem.id).to.be.equal(result.id)
      await expect(this.notificationsService.get(result.id)).to.reject(
        Error,
        `Cannot find notification with id ${result.id}`
      )
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

      expect(result.id).to.be.equal(notificationResult.id)
      expect(result.sentBy[0].channel).to.be.equal('email')
      expect(result.sentBy[0].ts).not.be.null()
    })
  })
})
