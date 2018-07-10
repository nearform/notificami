'use strict'

const AWS_MOCK = require('aws-sdk-mock')

const uuid = require('uuid/v4')
const { expect } = require('code')
const Lab = require('lab')
module.exports.lab = Lab.script()
const { describe, it: test, after } = module.exports.lab

/*
Send request response:
{
  ResponseMetadata: {
    RequestId: 'a283600d-b3ec-5531-923f-33b0dd49e8ea'
  },
  MD5OfMessageBody: 'f32100ce44f559f2854aaf59a4c5f887',
  MessageId: 'b19b9c05-45bc-483b-b27b-bf80d0c69e2c',
  SequenceNumber: '18838717274950895872'
}

Consumer message:
{
  "ResponseMetadata": {
    "RequestId":"95733e14-e5cd-5193-bab1-6daa834bbe2a"
  },
  "Messages": [
    {
      "MessageId": "73c94793-0b30-426b-87cc-1319605b1d5f",
      "ReceiptHandle": "AQEB7zu3d1iWHrbR/7kMN1yU48XWcJtT0lrSBYrOB2BSY/37dLm9uNY5HvgK3dFCxNJbdSL+ZoNZZsIHeT6Bnq5yFabCJFyGMSJSSHmIE3SB9apEiZ47tBaHS35iZXk+X38m8TEXRKrAjVe2rgAPyJbUZUlSpTiPRtHjR6vQa8Sx97OSFJ+smS5YTdHq41fovlohakFjtlO5nJ6a39bLgPYujCup1G+jZuS8xzs0vUBC5joPzzRyqLjbeN1vvN81iR4OnsM0b8Mi3r/s2ZERXKd1m63dF8ph67h9nT+JQGazJ10=",
      "MD5OfBody": "f32100ce44f559f2854aaf59a4c5f887",
      "Body": "{\"message\":\"message\"}",
      "Attributes": {"SentTimestamp":"1531208774623"}
    }
  ]
}
*/

describe('producer/consumer', () => {
  after(async () => {
    AWS_MOCK.restore()
  })

  test('sendToQueue', async () => {
    const { SQS, config } = require('./build-aws-sqs')
    const Producer = require('../lib/producer')
    const Consumer = require('../lib/consumer')
    const producer = new Producer(SQS, config)

    let done
    const p = new Promise((resolve, reject) => {
      done = resolve
    })

    const c = new Consumer(SQS, config, async (err, message) => {
      expect(err).to.not.exist()
      expect(message).to.be.object()
      expect(message.ResponseMetadata).to.be.exist()
      expect(message.Messages).to.be.array()
      expect(message.Messages.length).to.be.at.least(1)
      expect(message.Messages[0].MessageId).to.exist()
      expect(message.Messages[0].Body).to.exist()

      c.stop()
      return done()
    })
    c.consume()

    const result = await producer.sendToQueue({ message: uuid() })

    expect(result).to.be.object()
    expect(result.ResponseMetadata).to.be.object()
    expect(result.MD5OfMessageBody).to.exist()
    expect(result.MessageId).to.exist()
    expect(result.SequenceNumber).to.exist()

    await p
  })
})
