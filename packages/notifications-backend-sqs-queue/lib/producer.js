'use strict'

class Producer {
  constructor(SQS, awsConfig) {
    this.SQS = SQS
    this.awsConfig = awsConfig
  }

  async sendToQueue(message = {}) {
    const result = await this.SQS.sendMessage({
      MessageBody: JSON.stringify(message),
      QueueUrl: this.awsConfig.SQSQueueURL,
      MessageGroupId: 'notificatons-queue'
    }).promise()

    return result
  }
}

module.exports = Producer
