import React from 'react'
import { NotificationsWrapper } from './NotificamiProvider'
import { NotificationsBox } from './NotificationsBox'
import { NotificationsList } from './NotificationsList'
import PropTypes from 'prop-types'

const NotificamiWidgetBase = ({ showList }) => {
  return (
    <div className="notification-widget">
      <NotificationsBox />
      {showList && <NotificationsList />}
    </div>
  )
}

NotificamiWidgetBase.propTypes = {
  showList: PropTypes.bool
}

export const NotificamiWidget = NotificationsWrapper(NotificamiWidgetBase)
