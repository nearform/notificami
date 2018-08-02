'use strict'
const uuidv1 = require('uuid/v1')
const AWS = require('aws-sdk')

class DynamoDbStorage {
  constructor(dynamoDb, options) {
    this.dynamoDb = dynamoDb
    this.TableName = options.TableName
  }

  async close() {
    // DynamoDb doesn't have a persistent connection
  }

  mapNotificationFromDb(raw) {
    if (!raw) return null

    const { Id, Notify, CreatedAt, ReadAt, SendStrategy, SentBy, UserIdentifier } = raw

    return {
      id: Id,
      notify: Notify,
      createdAt: CreatedAt,
      readAt: ReadAt,
      sendStrategy: SendStrategy,
      sentBy: SentBy || [],
      userIdentifier: UserIdentifier
    }
  }

  async add({ notify, sendStrategy, userIdentifier }) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ service: this.dynamoDb })

    const params = {
      Item: {
        Id: uuidv1(),
        Notify: notify,
        SendStrategy: sendStrategy,
        UserIdentifier: userIdentifier,
        CreatedAt: Date.now(),
        ReadAt: null,
        SentBy: []
      },
      ReturnConsumedCapacity: 'TOTAL',
      TableName: this.TableName
    }

    await documentClient.put(params).promise()
    return this.mapNotificationFromDb(params.Item)
  }

  async getByUserIdentifier(userIdentifier, offsetId, limit = 5) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ service: this.dynamoDb })
    const params = {
      TableName: this.TableName,
      ScanIndexForward: false,
      Limit: limit,
      KeyConditions: {
        UserIdentifier: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [userIdentifier]
        }
      }
    }

    if (offsetId) {
      params.KeyConditions.Id = {
        ComparisonOperator: 'LT',
        AttributeValueList: [offsetId]
      }
    }

    const result = await documentClient.query(params).promise()

    return { items: result.Items.map(item => this.mapNotificationFromDb(item)), hasMore: !!result.LastEvaluatedKey }
  }

  async hasMoreByUserIdentifier(userIdentifier, offsetId) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ service: this.dynamoDb })
    const params = {
      TableName: this.TableName,
      ScanIndexForward: false,
      Limit: 1,
      KeyConditions: {
        UserIdentifier: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [userIdentifier]
        }
      }
    }

    if (offsetId) {
      params.KeyConditions.Id = {
        ComparisonOperator: 'LT',
        AttributeValueList: [offsetId]
      }
    }
    const result = await documentClient.query(params).promise()

    return !!result.LastEvaluatedKey
  }

  async get(id) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ service: this.dynamoDb })
    const params = {
      TableName: this.TableName,
      IndexName: 'UUIDIndex',
      Limit: 1,
      ExpressionAttributeValues: {
        ':v1': id
      },
      KeyConditionExpression: 'Id = :v1'
    }
    const result = await documentClient.query(params).promise()

    if (!result.Count) {
      throw new Error(`Cannot find notification with id ${id}`)
    }
    return this.mapNotificationFromDb(result.Items[0])
  }

  async delete({ id }) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ service: this.dynamoDb })
    const notify = await this.get(id, true)

    const params = {
      TableName: this.TableName,
      Key: {
        UserIdentifier: notify.userIdentifier,
        Id: notify.id
      },
      ReturnValues: 'ALL_OLD'
    }

    const result = await documentClient.delete(params).promise()
    return this.mapNotificationFromDb(result.Attributes)
  }

  async setRead({ id }) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ service: this.dynamoDb })
    const notify = await this.get(id)

    const params = {
      ExpressionAttributeValues: {
        ':time': Date.now(),
        ':null': null
      },
      Key: {
        UserIdentifier: notify.userIdentifier,
        Id: notify.id
      },
      ReturnValues: 'ALL_NEW',
      TableName: this.TableName,
      UpdateExpression: 'SET ReadAt = :time',
      ConditionExpression: 'ReadAt = :null'
    }

    try {
      const result = await documentClient.update(params).promise()
      return this.mapNotificationFromDb(result.Attributes)
    } catch (e) {
      if (e.code === 'ConditionalCheckFailedException') {
        throw new Error(`The item with id ${id} was alreay set read`)
      }
      throw e
    }
  }

  async setUnread({ id }) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ service: this.dynamoDb })
    const notify = await this.get(id)

    const params = {
      ExpressionAttributeValues: {
        ':null': null
      },
      Key: {
        UserIdentifier: notify.userIdentifier,
        Id: notify.id
      },
      ReturnValues: 'ALL_NEW',
      TableName: this.TableName,
      UpdateExpression: 'SET ReadAt = :null'
    }

    const result = await documentClient.update(params).promise()
    return this.mapNotificationFromDb(result.Attributes)
  }

  async sentBy({ id, channel }) {
    const documentClient = new AWS.DynamoDB.DocumentClient({ service: this.dynamoDb })
    const notify = await this.get(id)

    const params = {
      ExpressionAttributeValues: {
        ':channel': [{ channel, ts: Date.now() }]
      },
      Key: {
        UserIdentifier: notify.userIdentifier,
        Id: notify.id
      },
      ReturnValues: 'ALL_NEW',
      TableName: this.TableName,
      UpdateExpression: `SET SentBy = list_append(SentBy, :channel)`
    }

    const result = await documentClient.update(params).promise()
    return this.mapNotificationFromDb(result.Attributes)
  }
}

module.exports = DynamoDbStorage
