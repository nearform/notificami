# Notifications

## Core notifications module

- you cannot specify the `multiProviderStrategy` options, we assume it will be fallback for all channels
- the strategy configuration is only an array of channels, they will be tried in sequence, the first to successed will stop the cycle
- add documentation

## Hapi notifications plugin

- we do not have an actual queue yet: we have a fake implementation that will just broadcast notifications to subscribers
- we do have a problem with the `eachSocket` function https://github.com/hapijs/nes/issues/248
- we do have a PR open on notif.me sdk to allow custom channels https://github.com/notifme/notifme-sdk/pull/57
- we may want to review `index.js` and extract some functions
- add documentation

## Hapi server

- NF_NOTIFICATION_CONFIG_BUILDER_PATH: is this the best approach to the problem of getting a dynamic custom config?
- add documentation

