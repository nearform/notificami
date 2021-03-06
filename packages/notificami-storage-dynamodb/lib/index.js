'use strict'

const AWS = require('aws-sdk')
const DynamoDbStorage = require('./storage')

module.exports.plugin = {
  pkg: require('../package.json'),
  register: async function(server, options, next /* hapi 16.x compat */) {
    try {
      AWS.config.credentials = new AWS.Credentials(
        options.ApplicationUserAccessKey,
        options.ApplicationUserSecretAccessKey
      )

      const awsService = {
        apiVersion: '2012-08-10',
        region: options.Region
      }

      if (options.AWSEndpoint) {
        awsService.endpoint = options.AWSEndpoint
      }

      const storageService = new DynamoDbStorage(new AWS.DynamoDB(awsService), { TableName: options.TableName })

      server.decorate('server', 'storageService', storageService)
      return next()
    } catch (err) {
      if (next && typeof next === 'function') {
        return next(err)
      }
      throw err
    }
  }
}
