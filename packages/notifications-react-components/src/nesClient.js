import { Client as NesClient } from 'nes'

export function buildWebsocketClient(baseUrl, options) {
  return new NesClient(baseUrl, options)
}

export function WebsocketService(client) {
  /**
   * Get the notification list
   * @param string user
   * @param string|number offsetId
   * @returns {Promise<Comments[]>}
   */
  const getNotifications = async (user, offsetId) => {
    let response
    if (offsetId) {
      response = await client.request(`/users/${user}/notifications/${offsetId}`)
    } else {
      response = await client.request(`/users/${user}/notifications`)
    }
    const { payload } = response
    return payload
  }

  /**
   * Set a notification read
   * @param {Notification} notification
   * @returns {Promise<void>}
   */
  const setNotificationRead = async notification => {
    const options = {
      method: 'POST',
      path: `/notifications/${notification.id}/read`
    }

    return (await client.request(options)).payload
  }

  /**
   * Set a notification unread
   * @param {Notification} notification
   * @returns {Promise<void>}
   */
  const setNotificationUnread = async notification => {
    const options = {
      method: 'POST',
      path: `/notifications/${notification.id}/unread`
    }

    return (await client.request(options)).payload
  }

  /**
   * Remove a notification
   * @param {Notification} notification
   * @returns {Promise<void>}
   */
  const removeNotification = async notification => {
    const options = {
      method: 'DELETE',
      path: `/notifications/${notification.id}`
    }

    await client.request(options)
  }

  /**
   * Subscribe on user notifications
   * @param user identifier
   * @param {socketEventCallback} handler
   * @returns {Promise<*>}
   */
  const onUserNotification = async (user, handler) => {
    await client.subscribe(`/users/${user}`, handler)

    return () => client.unsubscribe(`/users/${user}`, handler)
  }

  return {
    setNotificationUnread,
    setNotificationRead,
    removeNotification,
    getNotifications,
    onUserNotification
  }
}
