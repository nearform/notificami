import React from 'react'
import PropTypes from 'prop-types'
import onClickOutside from 'react-onclickoutside'

import { NotificationsWrapper } from './NotificationsProvider'

class DefaultNotificationItem extends React.Component {
  render() {
    return (
      <div className="notifications-list-item">
        <div>{this.props.notification.notify.content}</div>
        {this.props.notification.notify.url && <a href={this.props.notification.notify.url}>Go see it...</a>}
        <button onClick={this.props.onRemove}>X</button>
      </div>
    )
  }
}

DefaultNotificationItem.propTypes = {
  notification: PropTypes.object.isRequired,
  onRemove: PropTypes.func
}

export class NotificationsListBase extends React.Component {
  constructor(props) {
    super(props)
    this.handleClickOutside = this.handleClickOutside.bind(this)
  }

  handleClickOutside(evt) {
    if (evt.srcElement.className === 'notifications-box') {
      return
    }
    this.props.closeList()
  }

  render() {
    if (!this.props.active && (!this.props.notifications || this.props.notifications.length === 0)) {
      return (
        <div className="notifications-list">
          <h3>Notifications</h3>
          <p className="not-active">Notifications service is not active.</p>
        </div>
      )
    }

    if (!this.props.notifications || this.props.notifications.length === 0)
      return (
        <div className="notifications-list">
          <h3>Notifications</h3>
          <p className="no-items">No notifications.</p>
        </div>
      )

    const NotificationItem = this.props.NotificationItem || DefaultNotificationItem

    return (
      <div className="notifications-list">
        <h3>Notifications</h3>

        {this.props.notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={() => this.props.removeNotificationFromList(notification)}
          />
        ))}
      </div>
    )
  }
}

NotificationsListBase.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.object),
  active: PropTypes.bool,
  NotificationItem: PropTypes.func,
  removeNotificationFromList: PropTypes.func,
  closeList: PropTypes.func.isRequired
}

export const NotificationsList = NotificationsWrapper(onClickOutside(NotificationsListBase))
