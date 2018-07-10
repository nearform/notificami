'use strict'

const { SQS, awsStack } = require('./aws')

async function sendToQueue(queue, message = {}) {
  const result = await SQS.sendMessage({
    MessageBody: JSON.stringify(message),
    QueueUrl: awsStack.SQSQueueURL,
    MessageGroupId: 'notificatons-queue'
  }).promise()

  return result
}

module.exports = {
  sendToQueue
}
