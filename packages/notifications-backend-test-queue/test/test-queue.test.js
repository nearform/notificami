'use strict'

const { expect } = require('code')
const Lab = require('lab')
module.exports.lab = Lab.script()
const { describe, it: test } = module.exports.lab

const { TestQueue } = require('../src/test-queue')

describe('Test queue', () => {
  test('sendToQueue: it should return null if no queue has been registered', async () => {
    const queue = new TestQueue()
    const result = await queue.sendToQueue('random', {})

    expect(result).to.be.null()
  })

  test('sendToQueue: it should return null if publishing on a different queue that the present ones', async () => {
    const queue = new TestQueue()
    queue.consume('my-queue', async () => ({ result: ' success' }))

    const result = await queue.sendToQueue('random', {})
    expect(result).to.be.null()
  })

  test('sendToQueue: it should return the list of result for each handler', async () => {
    const queue = new TestQueue()
    queue.consume('my-queue', async () => ({ result: ' success' }))

    const result = await queue.sendToQueue('my-queue', {})
    expect(result).to.equal([{ result: ' success' }])
  })
})
