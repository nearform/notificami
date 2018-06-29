# Notifications

## Core notifications module

- you cannot specify the `multiProviderStrategy` options, we assume it will be fallback for all channels
- the strategy configuration is only an array of channels, they will be tried in sequence, the first to successed will stop the cycle
- The notifications service is strictly connected to postgres, allow the injection of an external service that manage the storage
- The sent_by is not set after the delivery
- add documentation


## Hapi notifications plugin

- we do not have an actual queue yet: we have a fake implementation that will just broadcast notifications to subscribers
- we do have a problem with the `eachSocket` function https://github.com/hapijs/nes/issues/248
- we do have a PR open on notif.me sdk to allow custom channels https://github.com/notifme/notifme-sdk/pull/57
- improve the ACK of socket delivered notifications
- we may want to review `index.js` and extract some functions
- separation of services (producer/consumer)
- the db pool is created in this layer but probably should be created in the server layer
- add documentation

## Hapi server
- NF_NOTIFICATION_CONFIG_BUILDER_PATH: is this the best approach to the problem of getting a dynamic custom config?
- add documentation

