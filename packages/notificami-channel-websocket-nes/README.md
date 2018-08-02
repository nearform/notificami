# @nearform/notificami-channel-websocket-nes

This plugin will add a websocket channel to the notification platform.

## Install

```
npm install @nearform/notificami-channel-websocket-nes
```

## Configuration
To use the 'notificami-channel-websocket-nes' as a channel add it in the `channels` property

```
channels: {
  socket: {
    plugin: '@nearform/notificami-channel-websocket-nes'
  }
}
```

and use the name defined in the `channels` (`socket` in the example above) in the strategies definition:

```
strategies: {
  default: {
    name: 'default-to-sockets',
    channels: ['socket']
  }
}
```

## Connect the client

In the client connect to the service using the components provided by [@nearform/notificami-react-components](https://github.com/nearform/notificami/tree/master/packages/notificami-react-components)


```
import { WebsocketService, buildWebsocketClient, NotificamiProvider, NotificamiWidget } from '@nearform/notificami-react-component'

const client = buildWebsocketClient('ws://127.0.0.1:8482')
client.connect()

class SamplePage extends React.Component {
  render() {
    return (
      <NotificamiProvider userIdentifier='davide' service={WebsocketService(client)}>
        <div id='toolbar'>
          <NotificamiWidget />
        </div>
      </NotificamiProvider>
    )
  }
}
```


## License

Copyright nearForm Ltd 2018. Licensed under [Apache 2.0 license][license].

[license]: ./LICENSE.md

## Configuration

