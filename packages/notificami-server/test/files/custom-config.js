'use strict'

module.exports = {
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
