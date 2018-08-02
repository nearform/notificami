# @nearform/notificami-backend-core

`@nearform/notificami-backend-core` is the low level library used by `@nearform/notificami-backend-hapi-plugin`.

It provides the `NotificationsService` class that is at the base of the notification architecture and it also probides the default `PostgresStorage` class.

## Install

To install via npm:

```
npm install @nearform/notificami-backend-core
```

## Postgres Model

When using the postgres storage, a notification is an object with the following properties

```
Notification {
  id, // string
  notify, // JSON object containing your notification data
  createdAt, // Date
  readAt, // Date
  deletedAt, // Date
  sendStrategy, // String
  sentBy, // Array of string representing the channels the notification has been sent by
  userIdentifier // String representing the user to which the notification should be sent
}
```

## `NotificationsService` Usage

To create an instance of the `NotificationsService` class you need to use the `buildNotificationService` function

```javascript
const { buildNotificationService } = require('@nearform/notificami-backend-core')

const service = buildNotificationService(storage, config)
```

The `storage` parameters needs to be an object with the following api

```javascript
{
  async close() {}

  async add({ notify, sendStrategy, userIdentifier }) {}

  async getByUserIdentifier(userIdentifier, offsetId, limit) {}

  async hasMoreByUserIdentifier(userIdentifier, offsetId, limit) {}

  async get(id) {}

  async setRead({ id }) {}

  async delete({ id }) {}

  async sentBy({ id, channel }) {}
}
```

To have a look at an example of this, you can see how we implemented the [`PostgresStorage` class](https://github.com/nearform/notificami/blob/master/packages/notificami-backend-core/lib/postgres-storage.js)

The `config` parameters is options, and if provided should contain an object of the following format

```javascript
{
  strategies: {
    default: {
      name: 'list-with-fallback',
      channels: ['socket', 'webpush', 'email']
    },
    ...
  }
}
```

Each notifiation has a `sendStrategy` property. This property is checked against the given strategies when sending a new notification. If the `sendStrategy` is not present in the given `strategies` and error is thrown.

By default we add [these strategies](https://github.com/nearform/notificami/blob/master/packages/notificami-backend-core/config/index.js#L26-L31) if none is provided.

### <a name="notification-service"></a> `NotificationsService` api

`NotificationsService` will expose the following api

```javascript
class NotificationsService extends EventEmitter {
  // Main functions
  register(channel, name, handler) {}

  async send(notification, strategy) {}

  get config() {}

  // Proxy methods to the storage service
  async add({ notify, sendStrategy, userIdentifier }) {}

  async getByUserIdentifier(userIdentifier, offsetId, limit) {}

  async hasMoreByUserIdentifier(userIdentifier, offsetId) {}

  async get(id) {}

  async setRead({ id }) {}

  async setUnread({ id }) {}

  async delete({ id }) {}

  async sentBy({ id, channel }) {}

  async close() {}
}
```

As you can see `NotificationsService` is an event emitter. The events it emits are

- `add`: when a notification as been successfully stored
- `read`: when a notification is marked as read
- `unread`: when a notification is marked as unread
- `delete`: when a notification is deleted
- `sent_by`: when a notification is confirmed to have been sent by a certain

The notification service will also proxy all the storage interface functions.

#### `register(channel, name, handler)`

The `register` function will accept 3 parameters:

- `channel`: a string
- `name`: a string
- `handler`: an object or a function

**Note**: when the handler is an object it should be one of the [notif.me providers](https://github.com/notifme/notifme-sdk#2-providers). If it is a function it will be used as a [notif.me sdk custom provider](https://github.com/notifme/notifme-sdk#2-providers).

#### `async send(notification, strategy)`

The `send` function will accept 2 parameters:

- `notification`: an object representing the notification (as described in [`Notification`](#Postgres-Model))
- `strategy`: an optional string (default is `default`) that is the strategy to use to deliver this notification (it should be one of the strategies defined in the `config` object passed to `buildNotificationService`)

### `config`

The `config` property will return the configuration built by calling `register` one or more time. This configurarion maps to the [notif.me sdk](https://github.com/notifme/notifme-sdk) configuration with a limitation: the user cannot set the `multiProviderStrategy` option. As of now, that is fixed to `fallback`.

## Configuring Postgres storage

If you decided to use the default postgres storage, you can configure some of it's parameters via env variables

```
NF_NOTIFICATIONS_PGHOST
NF_NOTIFICATIONS_PGUSER
NF_NOTIFICATIONS_PGDATABASE
NF_NOTIFICATIONS_PGPASSWORD
NF_NOTIFICATIONS_PGPORT
```

## Development

### Initializing the db

To initialize the db you can run:

```
npm run pg:test:init
```

This will drop the `comments_test` database if it exists. Re-create it and migrate it to the latest schema.

For local development there should be sensible defaults in [`config/index.js`](./config/index.js).

#### Postgres on Docker?

If you want to run postgres on docker, install [docker](https://docs.docker.com/install/) and run the following command

```
docker-compose up postgres
```

### Run tests

Once the db is up and initialized, run

```
npm test
```

To run a single test you can use the following command

```
npx lab <test/to/run.js> // (ie: npx lab test/lib/notifiations-events.test.js)
```

## License

Copyright nearForm Ltd 2018. Licensed under [Apache 2.0 license][license].

[license]: ./LICENSE.md
