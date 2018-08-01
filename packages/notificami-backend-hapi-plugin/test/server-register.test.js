'use strict'

const { expect, fail } = require('code')
const Lab = require('lab')
const sinon = require('sinon')

module.exports.lab = Lab.script()
const { describe, it: test, beforeEach, afterEach } = module.exports.lab

const logMessage = process.send ? process.send : console.log // eslint-disable-line no-console
describe('Notifications REST API Registration', () => {
  let loggerStub
  let server = null

  beforeEach(async () => {
    try {
      loggerStub = sinon.spy()
      server = require('hapi').Server({
        host: '127.0.0.1',
        port: 8080
      })
      server.events.on('log', loggerStub)
    } catch (err) {
      logMessage(`Failed to build server: ${err.message}`)
      process.exit(1)
    }
  })

  afterEach(async () => {
    return server.stop()
  })

  test('validate the parameters', async () => {
    try {
      await server.register({
        plugin: require('../lib/index'),
        options: { pg: 'somevalue' }
      })
      fail('I should have chatched an error...')
    } catch (e) {
      expect(e.message).equal('child "pg" fails because ["pg" must be an object]')
    }
  })

  test('if the storage contains a value should be used', async () => {
    await server.register({
      plugin: require('../lib/index'),
      options: {
        storage: {
          plugin: 'someplugin'
        }
      }
    })
    expect(loggerStub.getCall(0).args[0].tags).to.be.equal(['error', 'initialize-storage', 'someplugin'])
  })
})
