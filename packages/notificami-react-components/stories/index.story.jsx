import { storiesOf } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import React from 'react'

import { WebsocketService, buildWebsocketClient } from '../src/nesClient'
import { NotificamiProvider } from '../src/components/NotificamiProvider'
import { NotificamiWidget } from '../src/components/NotificamiWidget'
import { NotificationsList } from '../src/components/NotificationsList'

export class Notificami extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      service: null
    }
  }

  async componentDidMount() {
    try {
      const client = buildWebsocketClient('ws://127.0.0.1:8482')
      await client.connect()

      this.setState({
        service: WebsocketService(client)
      })
    } catch (e) {
      this.props.logger && this.props.logger.error(e)
    }
  }

  render() {
    return (
      <NotificamiProvider userIdentifier={this.props.user} service={this.state.service}>
        <h1>This is a test panel for the user {this.props.user}</h1>
        <NotificamiWidget />
      </NotificamiProvider>
    )
  }
}

storiesOf('Notificami', module)
  .add('Default user Davide', () => <Notificami user="davide">Start from here</Notificami>)
  .add('Default user Filippo', () => <Notificami user="filippo">Start from here</Notificami>)
  .add('NotificationsList not active', () => <NotificationsList />)
  .add('NotificationsList with items and has more', () => (
    <NotificationsList
      active
      notifications={[
        { id: 10, notify: { content: 'Add a commet here' }, createdAt: '2018-07-02T09:18:04.555Z' },
        { id: 11, notify: { content: 'Add a commet here' }, createdAt: '2018-07-02T09:18:04.555Z' },
        { id: 12, notify: { content: 'Add a commet here' }, createdAt: '2018-07-02T09:18:04.555Z' }
      ]}
      hasMore
      loadMore={action('Load more')}
    />
  ))
  .add('NotificationsList with items and has more and is loading', () => (
    <NotificationsList
      active
      notifications={[
        { id: 10, notify: { content: 'Add a commet here' }, createdAt: '2018-07-02T09:18:04.555Z' },
        { id: 11, notify: { content: 'Add a commet here' }, createdAt: '2018-07-02T09:18:04.555Z' },
        { id: 12, notify: { content: 'Add a commet here' }, createdAt: '2018-07-02T09:18:04.555Z' }
      ]}
      hasMore
      isLoadingMore
    />
  ))
  .add('NotificationsList with items', () => (
    <NotificationsList
      active
      notifications={[
        { id: 10, notify: { content: 'Add a commet here' }, createdAt: '2018-07-02T09:18:04.555Z' },
        { id: 11, notify: { content: 'Add a commet here' }, createdAt: '2018-07-02T09:18:04.555Z' },
        { id: 12, notify: { content: 'Add a commet here' }, createdAt: '2018-07-02T09:18:04.555Z' }
      ]}
    />
  ))
  .add('NotificationsList without items', () => <NotificationsList active notifications={[]} />)
