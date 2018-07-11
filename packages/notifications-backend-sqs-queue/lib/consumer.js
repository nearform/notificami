'use strict'

/**
 * Should we use https://github.com/bbc/sqs-consumer ??
 */
class Consumer {
  constructor(SQS, awsConfig, handler) {
    this.SQS = SQS
    this.awsConfig = awsConfig
    this.queue = awsConfig.SQSQueueName
    this.handler = handler
    this.stopped = false
  }

  consume() {
    this.start(this.queue, (err, message, done) => {
      this.handler(err, message, done).catch(err => {
        this.stopped = true
        console.error(err)
      })

      if (!this.stopped) this.consume()
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

  async start(queue, callback) {
    await this.SQS.setQueueAttributes({
      QueueUrl: this.awsConfig.SQSQueueURL,
      Attributes: {
        ReceiveMessageWaitTimeSeconds: '2'
      }
    }).promise()

    try {
      const result = await this.SQS.receiveMessage({
        QueueUrl: this.awsConfig.SQSQueueURL,
        MaxNumberOfMessages: 1,
        MessageAttributeNames: ['All'],
        AttributeNames: ['SentTimestamp'],
        WaitTimeSeconds: 2
      }).promise()

      if (!result.Messages || result.Messages.length === 0) {
        return callback()
      }

      result.Messages.forEach(message => {
        callback(null, message, async error => {
          if (error) return

          await this.SQS.deleteMessage({
            QueueUrl: this.awsConfig.SQSQueueURL,
            ReceiptHandle: message.ReceiptHandle
          }).promise()
        })
      })
    } catch (e) {
      return callback(e)
    }
  }
}

module.exports = Consumer
