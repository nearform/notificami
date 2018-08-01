module.exports = {
  buildPool: require('./dbPool'),
  buildNotificationsService: require('./notifications'),
  PostgresStorage: require('./postgres-storage'),
  config: require('../config')
}
