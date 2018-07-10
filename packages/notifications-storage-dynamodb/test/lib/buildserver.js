const AWS = require('aws-sdk')

function getStack() {
  if (process.env.DDB_SERVER === 'local') {
    return {
      TableName: 'TestTableName',
      Region: 'local',
      AWSendpoint: 'http://localhost:8000'
    }
  }
  return require(process.env.DDB_STACK_PATH)
}

async function resetDb(dynamoDb, awsStack) {
  const result = await dynamoDb.scan({ TableName: awsStack.TableName }).promise()
  for (let Item of result.Items) {
    let params = {
      Key: {
        UserIdentifier: Item.UserIdentifier,
        Id: Item.Id
      },
      TableName: awsStack.TableName
    }
    await dynamoDb.deleteItem(params).promise()
  }
}

async function prepareDDB(awsStack) {
  if (process.env.DDB_SERVER !== 'local') {
    AWS.config.credentials = new AWS.Credentials(
      awsStack.ApplicationUserAccessKey,
      awsStack.ApplicationUserSecretAccessKey
    )
    return new AWS.DynamoDB({ apiVersion: '2012-08-10', region: awsStack.Region })
  }

  const awsInit = {
    accessKeyId: awsStack.ApplicationUserAccessKey || 'some-useless-value',
    secretAccessKey: awsStack.ApplicationUserSecretAccessKey || 'some-useless-value',
    region: awsStack.Region || 'local'
  }

  AWS.config.update(awsInit)
  const dynamoDb = new AWS.DynamoDB({ apiVersion: '2012-08-10', endpoint: awsStack.AWSendpoint })

  try {
    await dynamoDb.deleteTable({ TableName: awsStack.TableName }).promise()
  } catch (e) {
    if (e.code !== 'ResourceNotFoundException') {
      throw e
    }
  }

  await dynamoDb
    .createTable({
      AttributeDefinitions: [
        {
          AttributeName: 'UserIdentifier',
          AttributeType: 'S'
        },
        {
          AttributeName: 'Id',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'UserIdentifier',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'Id',
          KeyType: 'RANGE'
        }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UUIDIndex',
          KeySchema: [
            {
              AttributeName: 'Id',
              KeyType: 'HASH'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      },
      TableName: awsStack.TableName
    })
    .promise()

  return dynamoDb
}

module.exports = {
  getStack,
  resetDb,
  prepareDDB
}
