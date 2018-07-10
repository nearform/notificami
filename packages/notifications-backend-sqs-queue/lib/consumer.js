'use strict'

const { SQS, awsStack } = require('./aws')

/**
 * Should we use https://github.com/bbc/sqs-consumer ??
 */
class Consumer {
  constructor(queue, handler) {
    this.queue = queue
    this.handler = handler
    this.stopped = false
  }

  consume() {
    start(this.queue, (err, message) => {
      this.handler(err, message)

      if (!this.stopped) this.consume()
    }).catch(err => {
      this.stopped = true
      console.error(err)
    })
  }

  restart() {
    if (this.stopped === true) {
      this.stopped = false
      this.consume()
    }
  }

  stop() {
    this.stopped = true
  }
}

async function start(queue, callback) {
  await SQS.setQueueAttributes({
    QueueUrl: awsStack.SQSQueueURL,
    Attributes: {
      ReceiveMessageWaitTimeSeconds: '2'
    }
  }).promise()

  try {
    const result = await SQS.receiveMessage({
      QueueUrl: awsStack.SQSQueueURL,
      MaxNumberOfMessages: 1,
      MessageAttributeNames: ['All'],
      AttributeNames: ['SentTimestamp'],
      WaitTimeSeconds: 2
    }).promise()

    if (!result.Messages || result.Messages.length === 0) {
      return callback()
    }

    const tasks = result.Messages.map(m => {
      return SQS.deleteMessage({
        QueueUrl: awsStack.SQSQueueURL,
        ReceiptHandle: m.ReceiptHandle
      }).promise()
    })

    await Promise.all(tasks)

    callback(null, result)
  } catch (e) {
    return callback(e)
  }
}

module.exports = Consumer
