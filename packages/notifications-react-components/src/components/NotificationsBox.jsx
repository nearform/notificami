import React from 'react'
import PropTypes from 'prop-types'

import { NotificationsWrapper } from './NotificationsProvider'

const NotificationsBoxBase = ({ notifications, active, toggleList }) => (
  <div className="notifications-box" onClick={toggleList}>
    {!active ? '!' : (notifications && notifications.length) || 0}
  </div>
)

NotificationsBoxBase.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.object).isRequired,
  active: PropTypes.bool,
  toggleList: PropTypes.func
}

export const NotificationsBox = NotificationsWrapper(NotificationsBoxBase)
