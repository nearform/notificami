'use strict'

const path = require('path')
const { expect } = require('code')
const Lab = require('lab')
module.exports.lab = Lab.script()
const { describe, it: test } = module.exports.lab

const config = require('../config')
const { buildServer } = require('../src/server')

describe('Server', () => {
  test('add config to the server', async () => {
    const server = await buildServer(config)

    expect(server.notificationsService.config).to.part.include({
      channels: {
        socket: {
          multiProviderStrategy: 'fallback',
          providers: [
            {
              type: 'custom',
              id: 'mysocketservice'
            }
          ]
        }
      }
    })
    expect(server.notificationsService.config.channels.socket.providers[0].send).to.be.a.function()
  })

  test('add config from custom file to the server', async () => {
    process.env.NF_NOTIFICATION_CONFIG_BUILDER_PATH = path.join(__dirname, './files/custom-config.js')
    const server = await buildServer(config)

    expect(server.notificationsService.config).to.part.include({
      channels: {
        email: {
          multiProviderStrategy: 'fallback',
          providers: [
            {
              type: 'ses',
              region: 'xxxxx',
              accessKeyId: 'xxxxx',
              secretAccessKey: 'xxxxx'
            },
            {
              type: 'sendgrid',
              apiKey: 'xxxxx'
            }
          ]
        },
        sms: {
          multiProviderStrategy: 'fallback',
          providers: [
            {
              type: 'twilio',
              accountSid: 'xxxxx',
              authToken: 'xxxxx'
            }
          ]
        }
      }
    })
  })
})
