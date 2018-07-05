import React from 'react'
import PropTypes from 'prop-types'
import onClickOutside from 'react-onclickoutside'

import { NotificationsWrapper } from './NotificationsProvider'

class DefaultNotificationItem extends React.Component {
  render() {
    return (
      <div className={`notifications-list-item ${this.props.notification.readAt ? 'read' : ''}`}>
        <div>{this.props.notification.notify.content}</div>
        {this.props.notification.notify.url && <a href={this.props.notification.notify.url}>Go see it...</a>}
        {this.props.notification.readAt ? (
          <button className="btn-unread" onClick={this.props.onSetUnread}>
            Set unread
          </button>
        ) : (
          <button className="btn-read" onClick={this.props.onSetRead}>
            Set read
          </button>
        )}
        <button className="btn-remove" onClick={this.props.onRemove}>
          X
        </button>
      </div>
    )
  }
}

DefaultNotificationItem.propTypes = {
  notification: PropTypes.object.isRequired,
  onRemove: PropTypes.func,
  onSetRead: PropTypes.func,
  onSetUnread: PropTypes.func
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

  renderHasMoreButton() {
    return this.props.isLoadingMore ? (
      <div className="loading">Loading...</div>
    ) : (
      <div className="has-more" onClick={this.props.loadMore}>
        Load more...
      </div>
    )
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

        <div className="items">
          {this.props.notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRemove={() => this.props.removeNotificationFromList(notification)}
              onSetUnread={() => this.props.setNotificationUnread(notification)}
              onSetRead={() => this.props.setNotificationRead(notification)}
            />
          ))}
        </div>
        {this.props.hasMore && this.renderHasMoreButton()}
      </div>
    )
  }
}

NotificationsListBase.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.object),
  active: PropTypes.bool,
  hasMore: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
  loadMore: PropTypes.func,
  setNotificationRead: PropTypes.func,
  setNotificationUnread: PropTypes.func,
  NotificationItem: PropTypes.func,
  removeNotificationFromList: PropTypes.func,
  closeList: PropTypes.func.isRequired
}

export const NotificationsList = NotificationsWrapper(onClickOutside(NotificationsListBase))
