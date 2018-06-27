'use strict'

async function buildConfig(server) {
  return {
    channels: {
      email: {
        ses: {
          region: 'xxxxx',
          accessKeyId: 'xxxxx',
          secretAccessKey: 'xxxxx'
        },
        sendgrid: {
          apiKey: 'xxxxx'
        }
      },
      sms: {
        twilio: {
          accountSid: 'xxxxx',
          authToken: 'xxxxx'
        }
      }
    },
    strategies: {
      default: {
        name: 'another',
        channels: ['email', 'sms']
      }
    }
  }
}

module.exports = buildConfig
