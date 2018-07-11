'use strict'

const defaultConfig = require('./config')
const { buildServer } = require('./src/server')

process.on('unhandledRejection', err => {
  console.log(err) // eslint-disable-line no-console
  process.exit(1)
})

if (process.env.NF_NOTIFICATION_CONFIG_PATH) {
  defaultConfig.notifications = require(process.env.NF_NOTIFICATION_CONFIG_PATH).notifications
}

buildServer(defaultConfig)
  .then(server => {
    return server.start()
  })
  .then(server => {
    console.log(`Server started on port ${defaultConfig.server.port}...`) // eslint-disable-line no-console
  })
