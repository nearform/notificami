const SQL = require('@nearform/sql')
const config = require('../config')
const buildPool = require('../lib/dbPool')
const notificationsMockData = require('./__mockData__/notifications')

function deleteNotifications(db) {
  const sql = SQL`
       DELETE FROM notification
    `
  return db.query(sql)
}
function addNotificationToDb(db, { notify, sendStrategy, userIdentifier, createdAt }) {
  const sql = SQL`
       INSERT INTO
          notification (notify, send_strategy, user_identifier, created_at)
        VALUES (${JSON.stringify(notify)}, ${sendStrategy}, ${userIdentifier}, ${createdAt})
        RETURNING *
    `
  return db.query(sql)
}

async function init() {
  try {
    console.log('Sample environment initialization') // eslint-disable-line
    const db = buildPool(config.pg)
    console.log('Delete notifications') // eslint-disable-line
    await deleteNotifications(db)
    console.log('Add notifications') // eslint-disable-line
    for (let notification of notificationsMockData) {
      await addNotificationToDb(db, notification)
    }
    console.log('added: ', notificationsMockData.length) // eslint-disable-line
    await db.end()
  } catch (e) {
    console.error(e) // eslint-disable-line
  }
}

init()
