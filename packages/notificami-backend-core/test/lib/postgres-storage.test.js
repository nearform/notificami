'use strict'

'use strict'

const { expect } = require('code')
const Lab = require('lab')
module.exports.lab = Lab.script()
const { describe, it: test } = module.exports.lab

const { PostgresStorage } = require('../../lib')

describe('Postgres storage', () => {
  const storage = new PostgresStorage({})

  test('mapNotificationFromDb should return null with null parameters', () => {
    expect(storage.mapNotificationFromDb()).to.be.null()
  })

  test('mapSentByFromDb should return null with null parameters', () => {
    expect(storage.mapSentByFromDb()).to.be.null()
  })
})
