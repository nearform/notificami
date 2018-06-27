'use strict'

const defaultConfig = require('./config')
const { buildServer } = require('./src/server')

process.on('unhandledRejection', err => {
  console.log(err) // eslint-disable-line no-console
  process.exit(1)
})

buildServer(defaultConfig)
  .then(server => {
    return server.start()
  })
  .then(server => {
    console.log('Server started...') // eslint-disable-line no-console
  })
