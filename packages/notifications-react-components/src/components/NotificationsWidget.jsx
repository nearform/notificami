import React from 'react'
import { NotificationsWrapper } from './NotificationsProvider'
import { NotificationsBox } from './NotificationsBox'
import { NotificationsList } from './NotificationsList'
import PropTypes from 'prop-types'

const NotificationsWidgetBase = ({ showList }) => {
  return (
    <div className="notification-widget">
      <NotificationsBox />
      {showList && <NotificationsList />}
    </div>
  )
}

NotificationsWidgetBase.propTypes = {
  showList: PropTypes.bool
}

export const NotificationsWidget = NotificationsWrapper(NotificationsWidgetBase)
