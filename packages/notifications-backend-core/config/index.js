'use strict'

const {
  NF_NOTIFICATIONS_PGHOST,
  NF_NOTIFICATIONS_PGUSER,
  NF_NOTIFICATIONS_PGDATABASE,
  NF_NOTIFICATIONS_PGPASSWORD,
  NF_NOTIFICATIONS_PGPORT
} = process.env

const isTest = process.env.NODE_ENV === 'test'

const config = {
  isProd: process.env.NODE_ENV === 'production',
  isTest,
  pg: {
    host: NF_NOTIFICATIONS_PGHOST || 'localhost',
    port: NF_NOTIFICATIONS_PGPORT || 5432,
    password: NF_NOTIFICATIONS_PGPASSWORD || 'postgres',
    // Allow both syntaxes for username - pg driver uses "user"
    user: NF_NOTIFICATIONS_PGUSER || 'postgres',
    username: NF_NOTIFICATIONS_PGUSER || 'postgres',
    database: NF_NOTIFICATIONS_PGDATABASE || (isTest ? 'notification_test' : 'notification')
  }
}

module.exports = config
