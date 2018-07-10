'use strict'

const awsStack = require('../../../aws-deploy/config/stack.json')
const AWS = require('aws-sdk')

AWS.config.update({ region: awsStack.Region })

module.exports = {
  SQS: new AWS.SQS({ apiVersion: '2012-11-05' }),
  awsStack
}
