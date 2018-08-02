'use strict'

const AWS_MOCK = require('aws-sdk-mock')
AWS_MOCK.mock('SQS', 'sendMessage', async () => {
  return {
    ResponseMetadata: {
      RequestId: 'a283600d-b3ec-5531-923f-33b0dd49e8ea'
    },
    MD5OfMessageBody: 'f32100ce44f559f2854aaf59a4c5f887',
    MessageId: 'b19b9c05-45bc-483b-b27b-bf80d0c69e2c',
    SequenceNumber: '18838717274950895872'
  }
})
AWS_MOCK.mock('SQS', 'setQueueAttributes', async () => {})
AWS_MOCK.mock('SQS', 'deleteMessage', async () => {})
AWS_MOCK.mock('SQS', 'receiveMessage', async () => ({
  ResponseMetadata: {
    RequestId: '95733e14-e5cd-5193-bab1-6daa834bbe2a'
  },
  Messages: [
    {
      MessageId: '73c94793-0b30-426b-87cc-1319605b1d5f',
      ReceiptHandle:
        'AQEB7zu3d1iWHrbR/7kMN1yU48XWcJtT0lrSBYrOB2BSY/37dLm9uNY5HvgK3dFCxNJbdSL+ZoNZZsIHeT6Bnq5yFabCJFyGMSJSSHmIE3SB9apEiZ47tBaHS35iZXk+X38m8TEXRKrAjVe2rgAPyJbUZUlSpTiPRtHjR6vQa8Sx97OSFJ+smS5YTdHq41fovlohakFjtlO5nJ6a39bLgPYujCup1G+jZuS8xzs0vUBC5joPzzRyqLjbeN1vvN81iR4OnsM0b8Mi3r/s2ZERXKd1m63dF8ph67h9nT+JQGazJ10=',
      MD5OfBody: 'f32100ce44f559f2854aaf59a4c5f887',
      Body: '...',
      Attributes: { SentTimestamp: '1531208774623' }
    }
  ]
}))

const AWS = require('aws-sdk')
AWS.config.update({ region: 'local' })

module.exports = {
  SQS: new AWS.SQS({ apiVersion: '2012-11-05' }),
  config: {
    SQSQueueName: 'notifications-dev-queue.fifo',
    SQSQueueARN: 'arn:aws:sqs:eu-west-1:382731911776:notifications-dev-queue.fifo',
    SQSQueueURL: 'http://localhost:9876',
    Region: 'local'
  }
}
