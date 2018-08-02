'use strict'

class LocalQueue {
  constructor() {
    this.queues = []
  }

  async sendToQueue(queue, message) {
    if (!this.queues || !this.queues[queue]) {
      return null
    }

    const tasks = this.queues[queue].map(handler => handler(message))
    const result = await Promise.all(tasks)

    return result
  }

  consume(queue, handler) {
    if (!this.queues[queue]) {
      this.queues[queue] = []
    }

    this.queues[queue].push(handler)
  }
}

module.exports = { LocalQueue }
