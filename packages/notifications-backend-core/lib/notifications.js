'use strict'

const EventEmitter = require('events')
module.exports = function buildCommentsService(db) {
  class NotificationsService extends EventEmitter {
    async close() {
      return db.end()
    }
  }

  return new NotificationsService()
}
