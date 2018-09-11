'use strict'
const hapi = require('hapi')
const { expect, fail } = require('code')
const Lab = require('lab')
const sinon = require('sinon')

module.exports.lab = Lab.script()
const { describe, it: test, beforeEach } = module.exports.lab

const logMessage = process.send ? process.send : console.log // eslint-disable-line no-console
describe('Notifications REST API Registration', () => {
  let loggerStub
  let server = null

  beforeEach(async () => {
    try {
      loggerStub = sinon.spy()
      server = new hapi.Server()
      server.connection({
        host: '127.0.0.1',
        port: 8080
      })
      server.on('log', loggerStub)
    } catch (err) {
      logMessage(`Failed to build server: ${err.message}`)
      process.exit(1)
    }
  })

  test('validate the parameters', async () => {
    try {
      await server.register({
        register: require('../lib/index'),
        options: { pg: 'somevalue' }
      })
      fail('I should have chatched an error...')
    } catch (e) {
      expect(e.message).equal('child "pg" fails because ["pg" must be an object]')
    }
  })

  test('if the storage configuration contains an un-require-able plugin name', async () => {
    await server.register({
      register: require('../lib/index'),
      options: {
        storage: {
          plugin: 'someplugin'
        }
      }
    })
    return expect(loggerStub.getCall(1).args[0].tags).to.be.equal([
      'error',
      '@nearform/notificami-backend-hapi-16-plugin',
      'initialize-storage',
      'someplugin'
    ])
  })
})
