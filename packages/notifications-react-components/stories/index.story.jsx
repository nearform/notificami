import { storiesOf } from '@storybook/react'
import React from 'react'

import { WebsocketService, buildWebsocketClient } from '../src/nesClient'
import { NotificationsProvider } from '../src/components/NotificationsProvider'
import { NotificationsWidget } from '../src/components/NotificationsWidget'
import { NotificationsList } from '../src/components/NotificationsList'

export class Notifications extends React.Component {
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
      <NotificationsProvider userIdentifier={this.props.user} service={this.state.service}>
        <h1>This is a test panel for the user {this.props.user}</h1>
        <NotificationsWidget />
      </NotificationsProvider>
    )
  }
}

storiesOf('Notifications', module)
  .add('Default user Davide', () => <Notifications user="davide">Start from here</Notifications>)
  .add('Default user Filippo', () => <Notifications user="filippo">Start from here</Notifications>)
  .add('NotificationsList not active', () => <NotificationsList />)
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
