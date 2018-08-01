import React from 'react'
import PropTypes from 'prop-types'

import { NotificationsWrapper } from './NotificationsProvider'

const NotificationsBoxBase = ({ notifications, active, toggleList, hasMore }) => (
  <div className="notifications-box" onClick={toggleList}>
    {!active ? '!' : `${notifications && notifications.length}${hasMore ? '+' : ''}` || 0}
  </div>
)

NotificationsBoxBase.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.object).isRequired,
  active: PropTypes.bool,
  hasMore: PropTypes.bool,
  toggleList: PropTypes.func
}

export const NotificationsBox = NotificationsWrapper(NotificationsBoxBase)
