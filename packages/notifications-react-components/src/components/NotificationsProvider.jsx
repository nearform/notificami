import React from 'react'
import PropTypes from 'prop-types'
import _uniqBy from 'lodash/uniqBy'
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
      loadMore: this.loadMore.bind(this),
      isLoadingMore: false,
      active: !!props.service,
      service: props.service,
      showList: false
    }
  }

  triggerNotification(notification) {
    const newNotificationList = [notification, ...this.state.notifications]
    newNotificationList.sort((a, b) => a.id - b.id < 0)
    this.setState({
      notifications: _uniqBy(newNotificationList, function(e) {
        return e.id
      })
    })
  }

  async loadMore() {
    await this.setState({ isLoadingMore: true })

    try {
      const result = await this.props.service.getNotifications(
        this.props.userIdentifier,
        (this.state.notifications[this.state.notifications.length - 2] || {}).id
      )

      if (result.items.length) {
        const newNotificationList = [...this.state.notifications, ...result.items]
        newNotificationList.sort((a, b) => a.id - b.id < 0)
        this.setState({
          notifications: _uniqBy(newNotificationList, function(e) {
            return e.id
          }),
          hasMore: result.hasMore,
          isLoadingMore: false
        })
      } else {
        this.setState({
          hasMore: false,
          isLoadingMore: false
        })
      }
    } catch (e) {
      this.setState({
        loadMoreError: e.message,
        isLoadingMore: false
      })
    }
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
    this.initService()
  }

  setServiceInactive() {
    this.setState({
      active: false,
      service: null
    })
  }

  setServiceActive(service, { items = [], hasMore = false } = {}) {
    this.setState({
      notifications: items,
      hasMore,
      active: true,
      service
    })
  }

  async initService() {
    this.unsubscribe && (await this.unsubscribe())

    try {
      this.unsubscribe = await this.props.service.onUserNotification(this.props.userIdentifier, ({ type, payload }) => {
        if (type === 'new') {
          this.triggerNotification(payload)
        } else if (type === 'init') {
          this.setState({
            notifications: payload.items,
            hasMore: payload.hasMore
          })
        }
      })

      this.setServiceActive(this.props.service)
    } catch (e) {
      if (!!this.state.active || !!this.state.service) {
        this.setServiceInactive()
      }
    }
  }

  async componentDidUpdate(previousProps) {
    if (this.state.service && !this.props.service) {
      this.unsubscribe && (await this.unsubscribe())

      this.setServiceInactive()

      return
    }

    if (this.props.service && (!this.unsubscribe || previousProps.userIdentifier !== this.props.userIdentifier)) {
      this.initService()
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
