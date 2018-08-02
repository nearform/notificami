# @nearform/notificami-backend-local-queue

This plugin will create a local queue. With a local queue the system can be run as a single server.

## Install

```
npm install @nearform/notificami-backend-local-queue
```

## Configuration

To use the local plugin is just required to add it in the configuration

```
{
  plugins: [{ plugin: 'notifications-backend-local-queue' }],
  storage: {
    ...
  },
  channels: {
    ...
  },
  strategies: {
    ...
  }
}


## License

Copyright nearForm Ltd 2018. Licensed under [Apache 2.0 license][license].

[license]: ./LICENSE.md
