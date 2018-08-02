# @nearform/notificami-backend-hapi-plugin

`@nearform/notificami-backend-hapi-plugin` is a plugin to add the notificami REST API and Websockets to a [Hapi (17+)][hapi] server. It relies on the [`@nearform/notificami-backend-core` module](https://github.com/nearform/notificami/tree/master/packages/notificami-backend-core).

## Install

To install via npm:

```
npm install @nearform/notificami-backend-hapi-plugin
```

## Configuration

When initializing the `notifications-backend-hapi-plugin`, it will accept a options object of the followig format

```
{
  plugins: [{ plugin: 'notifications-backend-local-queue' }],
  storage: {
    plugin: 'notifications-storage-dynamodb',
    options: {
     TableName: 'notifications',
     ApplicationUserAccessKey: 'AKIAJVUSIUSERACCESSKEY',
     ApplicationUserSecretAccessKey: 'c9AHgAjhpsercretuseraccesskey',
     Region: 'eu-west-1'
   }
  },
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

The `plugins` option should contain an array of plugins to be used. We will install each plugin as an hapi plugin. An example on how to use and configure a plugin can be found in the [@nearform/notificami-sqs-queue](https://github.com/nearform/notificami/tree/master/packages/notificami-sqs-queue) module.

The `storage` option should contain an obect with definition of the storage used. If no storage is defined the default `postgres` storage is used. An example on how to use and configure the storage can be found in the [@nearform/notificami-storage-dynamodb](https://github.com/nearform/notificami/tree/master/packages/notificami-storage-dynamodb) module.

The `channels` option should be an object declaring which are the channels to be registered on `notif.me sdk`, they can be either an object (as `email.ses`) or an async function (as `email.sendgrid`) or a module to be required (as `socket`) that [will add its own channels/providers](#notifications-channel-websocket-nes).

To have a list of already implemented provider you can refer to [the providers list from `notif.me sdk`](https://github.com/notifme/notifme-sdk#2-providers)

The `strategies` option may define different strategies to use when delivering notifications. Each strategy should contain a list of channels. If the strategy in the [notification request](#notifications-backend-hapi-plugin) matches one of the strategies we definend, its channels will be used to send the notification. We will loop on the channels and stop at the first one that its successful in sending the notification.


## <a name="api"></a> HTTP APIs
The plugin mounts the following endpoints

**GET /users/{username}/notifications/{offsetId?}**

This endpoint will return the list of notifications for a user from the newest to the oldest starting from the notification with ID=`offestId`. If `offsetId`is not defined, the newest notifications are returned.

Return structure:
```
{
  items: [...],
  hasMore: true|false
}
```

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

**PUT /notifications/{idNotification}/read**

Set the notification `idNotification` as read

**PUT /notifications/{idNotification}/unread**

Set the notification `idNotification` as unread


**DELETE /notifications/{id}**

This endpoint will delete a notification.


## License

Copyright nearForm Ltd 2018. Licensed under [Apache 2.0 license][license].

[hapi]: https://hapijs.com/
[license]: ./LICENSE.md
