# Notifications

## Requirements

- node > 8
- postgres

## Install

```
npm install
```

## Run postgres on docker

```
docker-compose up postgres
```

## Run tests

```
npm test
```

## Things to know

- we do have a problem with the `eachSocket` function https://github.com/hapijs/nes/issues/248 . As of now, we have a fix (filtering the sockets by [ourselves](https://github.com/nearform/notifications/blob/master/packages/notifications-channel-websocket-nes/lib/subscriptions.js#L12-L22)).

- we do have an open PR on `notif.me sdk` to allow custom channels https://github.com/notifme/notifme-sdk/pull/57 , we are using a [branch](https://github.com/nearform/notifications/blob/master/packages/notifications-backend-core/package.json#L23) for the time being.

## How does this work?

We have multiple packages, but there are 3 that are the basic building blocks:

### notifications-backend-core

This package contains the basic functionalities to store and send notifications.

The main builder function `buildNotificationService` expects 2 parameters: `storage` and `config`.

### Storage

The storage parameters should be an object with the following interface:

```
{
  async close() {}

  async add({ notify, sendStrategy, userIdentifier }) {}

  async getByUserIdentifier(userIdentifier) {}

  async get(id) {}

  async setRead({ id }) {}

  async delete({ id }) {}

  async sentBy({ id, channel }) {}
}
```

This object has the repsonsibility to store and map notification to some sort of storage. It also can freely decide what will be the structure of the notification object.
In our default implementation (prostgres) we have a structure that will be described below when describing the hapi plugin HTTP REST API responses.

#### Config

The `config` object will be used instead of the default configuration and should have the following format

```
{
  strategies: {
    default: {
      name: 'list-with-fallback',
      channels: ['socket', 'webpush', 'email']
    }
  }
}
```

#### Notification service

The object returned by `buildNotificationService` will expose the following functions

**`register(channel, name, handler)`**

The `register` function will accept 3 parameters:

- `channel`: a string
- `name`: a string
- `handler`: an object or a function

Note: when the handler is an object it should be one of the [notif.me providers](https://github.com/notifme/notifme-sdk#2-providers). If it is a function it will be used as a [notif.me sdk custom provider](https://github.com/notifme/notifme-sdk#2-providers).

**`async send(notification, strategy)`**

The `send` function will accept 2 parameters:

- `notification`: an object representing the notification
- `strategy`: a string that is the strategy to use to deliver this notification (it should be one of the strategies defined in the config above)

**`config`**

The `config` property will return the configuration built by calling `register`. This configurarion maps to the [notif.me sdk](https://github.com/notifme/notifme-sdk) configuration with a limitation: the user cannot set the `multiProviderStrategy` option. As of now, that is fixed to `fallback`.


The notification service will also proxy all the storage interface functions and will emit events for adding (event `add`), setting as read (event `read`), deleting (event `delete`) and setting the notification "sent by" channel (event `sent_by`).

### notifications-backend-hapi-plugin

This plugin will add a set of HTTP REST endpoints to a hapi server.

**GET /users/{username}/notifications**

This endpoint will return the list of notifications for a user.

**POST /notifications**

This endpoint will create a new notification and trigger the notification process through a strategy.

The request should be something like the followig:

```
POST /notifications

{
  notify: { /* free structure */ },
  userIdentifier: 'xyz',
  sendStrategy: 'default' // this is optional
}
```

and the response will be (if using our postgres storage implementation)

```
{
  notify: { /* what has been passed in */ },
  readAt: null,
  deletedAt: null,
  sendStrategy: 'default',
  sentBy: [],
  userIdentifier: 'xyz'
}
```

**DELETE /notifications/{id}**

This endpoint will delete a notification.

#### Configuration

When initializing the `notifications-backend-hapi-plugin`, it will accept a options object of the followig format

```
{
  plugins: [{ plugin: 'notifications-backend-test-queue' }],
  channels: {
    email: {
      ses: {
        region: 'xxxxx',
        accessKeyId: 'xxxxx',
        secretAccessKey: 'xxxxx'
      },
      sendgrid: async (notification) => {}
    },
    socket: {
      plugin: 'notifications-channel-websocket-nes'
    }
  },
  strategies: {
    default: {
      name: 'default-to-sockets',
      channels: ['socket', 'email']
    }
  }
}
```

The `plugins` option should contain an array of plugins to be used. We will install each plugin as an hapi plugin.

If you want to change the storage system (by default it's postgres) you need to set the `server.storageService` variable. If that is present we will use that as the storage to be passed to the [`buildNotificationService`](#notifications-backend-core) function.

The `channels` option should be an object declaring which are the channels to be registered on `notif.me sdk`, they can be either an object (as `email.ses`) or an async function (as `email.sendgrid`) or a module to be required (as `socket`) that [will add its own channels/providers](#notifications-channel-websocket-nes).

To have a list of already implemented provider you can refer to [the providers list from `notif.me sdk`](https://github.com/notifme/notifme-sdk#2-providers)

The `strategies` option may define different strategies to use when delivering notifications. Each strategy should contain a list of channels. If the strategy in the [notification request](#notifications-backend-hapi-plugin) matches one of the strategies we definend, its channels will be used to send the notification. We will loop on the channels and stop at the first one that its successful in sending the notification.

### notification-server

This module contains an already working server that by default will store notifications in postgres and will use a example queue system (that is not suitable for prod).

To change the server configuration, create a custom configuration file and put its path as the value of the `NF_NOTIFICATION_CONFIG_PATH` env variable. We will use that file configuration to build our server instead of using our default.

The custom config file should be something like the following:

```
const config = {
  notifications: {
    channels: {
      socket: {
        plugin: 'notifications-channel-websocket-nes',
        options: {...}
      }
    },
    plugins: [{ plugin: 'notifications-backend-test-queue', options: {...} }],
    strategies: {
      default: {
        name: 'default-to-sockets',
        channels: ['socket']
      }
    }
  },
  server: {
    host: 'localhost',
    port: 8482
  }
}

module.exports = config
```

## Other plugins

While building the notification server, hapi-plugin and core modules, we found that a plugin approach would be the easiest one to let users define their own notification system. To have a look at what you can do by adding plugins to the server we will describe our 2 default plugins.

### notifications-backend-test-queue

This plugin will install a queue implementation to send and consume notifications.

The code is very easy, but its worth exaplinig each section.

First of all we need to listen to the `add` event, triggered every time a notification is stored. To do so we usee the `notificationsService` property of the `server` obejct. This property is set by the `notifications-backend-hapi-plugin`.

```javascript
async function register(server, options = {}) {
  // ...

  server.notificationsService.on('add', async notification => { // <=== Adding listener
    await queue.sendToQueue('notification-queue', notification)
  })
}
```

We will also add a consumer on the same server (usually not a good idea, but this is an example ;) ). to actually send the notification we reach agian for the `notificationsService` property on the `server` and call its `send` method.

```javascript
async function register(server, options = {}) {
  // ...
  queue.consume('notification-queue', async notification => {
    try {
      await server.notificationsService.send(notification, notification.sendStrategy) // <=== Sending notification
    } catch (e) {
      server.log(['error', 'notification', 'send'], e)
    }
  })
}
```

You can find the while code [here](https://github.com/nearform/notifications/tree/master/packages/notifications-backend-test-queue)

### notifications-channel-websocket-nes

This plugin will install [`nes`](https://github.com/hapijs/nes), add a new websocket to which clients can subscribe to and add a new channel to the notification service.

There are two important things this pluging does:

- it register it's own server method `notificationsChannelWebsocketNesNotifyUser`
- then it register a new channel in the `notificationsService` that uses that server method to actually send notifications through websockets

```javascript
exports.plugin = {
  pkg: require('../package.json'),
  register: async function(server, options) {

    // ...

    server.method('notificationsChannelWebsocketNesNotifyUser', notifyUser.bind(server))
    server.notificationsService.register('socket', 'websocket-nes', async notification => { // <=== Registering a new channel!
      return server.methods.notificationsChannelWebsocketNesNotifyUser(notification)
    })
  }
}
```

You can use the same pattern to add your own channels and implementations and then change the sending strategy via [custom configuration](#notification-server).

You can find the while code [here](https://github.com/nearform/notifications/tree/master/packages/notifications-channel-websocket-nes)
