'use strict'

const SQL = require('@nearform/sql')

class PostgresStorage {
  constructor(db) {
    this.db = db
  }

  async close() {
    return this.db.end()
  }

  async add({ notify, sendStrategy, userIdentifier }) {
    const sql = SQL`
       INSERT INTO
          notification (notify, send_strategy, user_identifier)
        VALUES (${JSON.stringify(notify)}, ${sendStrategy}, ${userIdentifier})
        RETURNING *
    `
    const res = await this.db.query(sql)
    let notification = this.mapNotificationFromDb(res.rows[0])

    return notification
  }

  async getByUserIdentifier(userIdentifier, offsetId, limit = 5) {
    const filters = []
    if (offsetId) {
      filters.push(SQL`AND n.id < ${offsetId}`)
    }

    const sql = SQL`
      SELECT
        n.*, json_agg(s) as sent_by
      FROM
        notification n
      LEFT JOIN
        sent_by s ON s.notification_id = n.id
      WHERE `

    sql.append(SQL`n.user_identifier = ${userIdentifier}`)
    sql.append(SQL`AND n.deleted_at IS NULL `)
    sql.append(sql.glue(filters, ' AND '))
    sql.append(SQL` GROUP BY
        n.id
      ORDER BY
        n.created_at DESC
      LIMIT ${limit}
    `)

    const res = await this.db.query(sql)
    return { items: res.rows.map(row => this.mapNotificationFromDb(row)) }
  }

  async hasMoreByUserIdentifier(userIdentifier, offsetId) {
    const filters = []
    if (offsetId) {
      filters.push(SQL`AND id < ${offsetId}`)
    }

    const sql = SQL`
      SELECT
        id
      FROM
        notification
      WHERE `

    sql.append(SQL`user_identifier = ${userIdentifier}`)
    sql.append(SQL`AND deleted_at IS NULL `)
    sql.append(sql.glue(filters, ' AND '))
    sql.append(SQL`LIMIT 1`)

    const res = await this.db.query(sql)
    return res.rows.length > 0
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
        n.id = ${id} AND n.deleted_at IS null
      GROUP BY
        n.id
    `

    const res = await this.db.query(sql)
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
    const res = await this.db.query(sql)
    if (res.rowCount === 0) throw new Error(`Cannot find notification with id ${id}`)

    let notification = this.mapNotificationFromDb(res.rows[0])

    return notification
  }

  async setUnread({ id }) {
    const sql = SQL`
      UPDATE
        notification
      SET
        read_at = null
      WHERE
        id = ${id}
      RETURNING *
    `
    const res = await this.db.query(sql)
    if (res.rowCount === 0) throw new Error(`Cannot find notification with id ${id}`)

    let notification = this.mapNotificationFromDb(res.rows[0])

    return notification
  }

  async delete({ id }) {
    const sql = SQL`
      UPDATE
        notification
      SET
        deleted_at = NOW()
      WHERE
        id = ${id}
      RETURNING *
    `
    const res = await this.db.query(sql)
    if (res.rowCount === 0) throw new Error(`Cannot find notification with id ${id}`)

    let notification = this.mapNotificationFromDb(res.rows[0])

    return notification
  }

  async sentBy({ id, channel }) {
    const sql = SQL`
       INSERT INTO
          sent_by (notification_id, channel)
        VALUES (${id}, ${channel})
        RETURNING *
    `
    const res = await this.db.query(sql)
    let sentBy = this.mapSentByFromDb(res.rows[0])

    return sentBy
  }

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
}

module.exports = PostgresStorage
