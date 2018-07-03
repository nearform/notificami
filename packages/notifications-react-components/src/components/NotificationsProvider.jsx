import React from 'react'
import PropTypes from 'prop-types'
import { childrenPropInterface } from './propInterfaces'

export const NotificationsContext = React.createContext('notifications-provider')

export class NotificationsProvider extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      NotificationItem: this.props.NotificationItem,
      notifications: [],
      removeNotificationFromList: this.removeNotificationFromList.bind(this),
      toggleList: this.toggleList.bind(this),
      closeList: this.closeList.bind(this),
      active: !!props.service,
      service: props.service,
      showList: false
    }
  }

  triggerNotification(notification) {
    this.setState({
      notifications: this.state.notifications.concat(notification)
    })
  }

  toggleList() {
    this.setState({ showList: !this.state.showList })
  }

  closeList() {
    this.setState({ showList: false })
  }

  removeNotificationFromList(notification) {
    let notifications = this.state.notifications
    const index = notifications.findIndex(n => {
      return n.id === notification.id
    })

    if (index === -1) {
      return
    }

    notifications.splice(index, 1)

    this.setState({
      notifications
    })
  }

  async componentDidMount() {
    if (!this.state.service) return

    try {
      this.unsubscribe = await this.state.service.onUserNotification(this.props.userIdentifier, notification =>
        this.triggerNotification(notification)
      )

      this.setState({
        active: true
      })
    } catch (e) {
      this.setState({
        service: null,
        active: false
      })
    }
  }

  setServiceInactive() {
    this.setState({
      active: false,
      service: null
    })
  }

  setServiceActive(service) {
    this.setState({
      notifications: [],
      active: true,
      service
    })
  }

  async componentDidUpdate(previousProps) {
    if (this.state.service && !this.props.service) {
      this.unsubscribe && (await this.unsubscribe())

      this.setServiceInactive()

      return
    }

    if (this.props.service && (!this.unsubscribe || previousProps.userIdentifier !== this.props.userIdentifier)) {
      this.unsubscribe && (await this.unsubscribe())

      try {
        this.unsubscribe = await this.props.service.onUserNotification(this.props.userIdentifier, notification =>
          this.triggerNotification(notification)
        )

        this.setServiceActive(this.props.service)
      } catch (e) {
        if (!!this.state.active || !!this.state.service) {
          this.setServiceInactive()
        }
      }
    }
  }

  async componentWillUnmount() {
    this.unsubscribe && (await this.unsubscribe())
  }

  render() {
    return <NotificationsContext.Provider value={this.state} children={this.props.children} />
  }
}

NotificationsProvider.propTypes = {
  userIdentifier: PropTypes.string,
  NotificationItem: PropTypes.func,
  service: PropTypes.func
}

export const NotificationsWrapper = Component => {
  return class NotificationsWrappedComponent extends React.Component {
    render() {
      return (
        <NotificationsContext.Consumer>
          {notificationsProps => <Component {...this.props} {...notificationsProps} />}
        </NotificationsContext.Consumer>
      )
    }
  }
}

NotificationsProvider.displayName = 'NotificationsProvider'

NotificationsProvider.propTypes = {
  userIdentifier: PropTypes.string.isRequired,
  service: PropTypes.object,
  children: childrenPropInterface
}
