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
    getNotifications,
    onUserNotification
  }
}
