'use strict'

const NotifmeSdk = require('notifme-sdk').default
const { cloneDeep } = require('lodash')
const EventEmitter = require('events')
const SQL = require('@nearform/sql')
const notifmeSdkDefaultConfig = {
  channels: {}
}

module.exports = function buildNotificationsService(db, config, strategy = 'default') {
  const notifmeSdkConfig = cloneDeep(notifmeSdkDefaultConfig)

  if (!config.strategies[strategy]) {
    throw new Error(`Cannot initialize the notification service with a non existing strategy (${strategy})`)
  }

  class NotificationsService extends EventEmitter {
    mapNotificationFromDb(raw) {
      if (!raw) return null

      const {
        id,
        notify,
        created_at: createdAt,
        read_at: readAt,
        deleted_at: deletedAt,
        send_strategy: sendStrategy,
        sent_by: sentBy,
        user_identifier: userIdentifier
      } = raw

      return {
        id,
        notify,
        createdAt,
        readAt,
        deletedAt,
        sendStrategy,
        sentBy: sentBy ? sentBy.filter(v => !!v) : [],
        userIdentifier
      }
    }

    mapSentByFromDb(raw) {
      if (!raw) return null

      const { id, notification_id: notificationId, channel, sent_at: sentAt } = raw

      return { id, notificationId, channel, sentAt }
    }

    async close() {
      return db.end()
    }

    register(channel, name, handler) {
      if (!channel || !name || !handler) {
        throw new Error('Channel, name and handler parameters are mandatory')
      }

      if (!notifmeSdkConfig.channels[channel]) {
        notifmeSdkConfig.channels[channel] = {}
      }

      notifmeSdkConfig.channels[channel].multiProviderStrategy = 'fallback'

      if (!notifmeSdkConfig.channels[channel].providers) {
        notifmeSdkConfig.channels[channel].providers = []
      }

      notifmeSdkConfig.channels[channel].providers.push({
        type: 'custom',
        id: name,
        send: handler
      })
    }

    async send(notification) {
      if (!this.notifmeSdk) {
        this.notifmeSdk = new NotifmeSdk(notifmeSdkConfig)
      }

      let result
      for (const channel of config.strategies[strategy].channels) {
        if (!notifmeSdkConfig.channels[channel]) continue

        result = await this.notifmeSdk.send({ [channel]: notification })
        if (result.status === 'success') {
          break
        }
      }

      return result
    }

    get config() {
      return cloneDeep(notifmeSdkConfig)
    }

    async add({ notify, sendStrategy, userIdentifier }) {
      const sql = SQL`
         INSERT INTO
            notification (notify, send_strategy, user_identifier)
          VALUES (${JSON.stringify(notify)}, ${sendStrategy}, ${userIdentifier})
          RETURNING *
      `
      const res = await db.query(sql)
      let notification = this.mapNotificationFromDb(res.rows[0])

      this.emit('add', notification)

      return notification
    }

    async get(id) {
      const sql = SQL`
        SELECT
          n.*, json_agg(s) as sent_by
        FROM
          notification n
        LEFT JOIN
          sent_by s ON s.notification_id = n.id
        WHERE
          n.id = ${id}
        GROUP BY
          n.id
      `

      const res = await db.query(sql)
      if (res.rowCount === 0) throw new Error(`Cannot find notification with id ${id}`)

      return this.mapNotificationFromDb(res.rows[0])
    }

    async setRead({ id }) {
      const sql = SQL`
        UPDATE 
          notification
        SET
          read_at = NOW()
        WHERE
          id = ${id}   
        RETURNING *
      `
      const res = await db.query(sql)
      if (res.rowCount === 0) throw new Error(`Cannot find notification with id ${id}`)

      let notification = this.mapNotificationFromDb(res.rows[0])

      this.emit('read', notification)

      return notification
    }

    async setDeleted({ id }) {
      const sql = SQL`
        UPDATE 
          notification
        SET
          deleted_at = NOW()
        WHERE
          id = ${id}   
        RETURNING *
      `
      const res = await db.query(sql)
      if (res.rowCount === 0) throw new Error(`Cannot find notification with id ${id}`)

      let notification = this.mapNotificationFromDb(res.rows[0])

      this.emit('delete', notification)

      return notification
    }

    async sendBy({ id, channel }) {
      const sql = SQL`
         INSERT INTO
            sent_by (notification_id, channel)
          VALUES (${id}, ${channel})
          RETURNING *
      `
      const res = await db.query(sql)
      let sentBy = this.mapSentByFromDb(res.rows[0])

      this.emit('sent_by', sentBy)

      return sentBy
    }
  }

  return new NotificationsService()
}
