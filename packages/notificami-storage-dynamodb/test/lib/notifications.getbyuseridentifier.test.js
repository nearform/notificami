'use strict'

const { expect } = require('code')
const Lab = require('lab')
module.exports.lab = Lab.script()

const { prepareDDB, resetDb, getStack } = require('./buildserver')

const { describe, it: test, before, after } = module.exports.lab
const { buildNotificationsService } = require('@nearform/notificami-backend-core')

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

const DynamoDbStorage = require('../../lib/storage')

describe('Notification', () => {
  const notificationList = []
  before({ timeout: process.env.CI ? 100000 : 10000 }, async () => {
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

  describe('hasMoreByUserIdentifier', () => {
    test('should correctly return if the user has other notifications', async () => {
      let result = await this.notificationsService.hasMoreByUserIdentifier('davide')
      expect(result).to.be.true()
      result = await this.notificationsService.hasMoreByUserIdentifier('filippo')
      expect(result).to.be.true()
      result = await this.notificationsService.hasMoreByUserIdentifier('jack')
      expect(result).to.be.false()
    })

    test('it should return false if is set the oldest norification', async () => {
      let result = await this.notificationsService.hasMoreByUserIdentifier('davide', notificationList[0].id)
      expect(result).to.be.false()
      result = await this.notificationsService.hasMoreByUserIdentifier('filippo', notificationList[6].id)
      expect(result).to.be.false()
    })
  })

  describe('getByUserIdentifier', () => {
    test('should correctly return the notification list related to the user', async () => {
      let result = await this.notificationsService.getByUserIdentifier('davide')
      expect(result.items.length).to.be.equal(5)
      expect(result.items[0].notify.content).to.be.equal('Some notification content 9')
      expect(result.items[1].notify.content).to.be.equal('Some notification content 8')
      expect(result.items[2].notify.content).to.be.equal('Some notification content 7')
      expect(result.items[3].notify.content).to.be.equal('Some notification content 6')
      expect(result.items[4].notify.content).to.be.equal('Some notification content 5')

      result = await this.notificationsService.getByUserIdentifier('filippo')
      expect(result.items.length).to.be.equal(2)
      expect(result.items[0].notify.content).to.be.equal('Some notification to Filippo 2')
      expect(result.items[1].notify.content).to.be.equal('Some notification to Filippo 1')

      result = await this.notificationsService.getByUserIdentifier('jack')
      expect(result.items.length).to.be.equal(0)
    })

    test('should correctly return the notification list related to the user with a different limit', async () => {
      let result = await this.notificationsService.getByUserIdentifier('davide', null, 6)
      expect(result.items.length).to.be.equal(6)
      expect(result.items[0].notify.content).to.be.equal('Some notification content 9')
      expect(result.items[1].notify.content).to.be.equal('Some notification content 8')
      expect(result.items[2].notify.content).to.be.equal('Some notification content 7')
      expect(result.items[3].notify.content).to.be.equal('Some notification content 6')
      expect(result.items[4].notify.content).to.be.equal('Some notification content 5')
      expect(result.items[5].notify.content).to.be.equal('Some notification content 4')
    })

    test('set a offsetId it should return the list of the notifications older than the ID', async () => {
      let result = await this.notificationsService.getByUserIdentifier('davide', notificationList[4].id)
      expect(result.items.length).to.be.equal(4)
      expect(result.items[0].notify.content).to.be.equal('Some notification content 4')
      expect(result.items[1].notify.content).to.be.equal('Some notification content 3')
      expect(result.items[2].notify.content).to.be.equal('Some notification content 2')
      expect(result.items[3].notify.content).to.be.equal('Some notification content 1')
    })
  })
})
