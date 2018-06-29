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
              id: 'websocket-nes'
            }
          ]
        }
      }
    })
    expect(server.notificationsService.config.channels.socket.providers[0].send).to.be.a.function()
  })
})
