import { Client as NesClient } from 'nes'

export function buildWebsocketClient(baseUrl, options) {
  return new NesClient(baseUrl, options)
}

export function WebsocketService(client) {
  /**
   *
   * @param user identifier
   * @param {socketEventCallback} handler
   * @returns {Promise<*>}
   */
  const onUserNotification = async (user, handler) => {
    await client.subscribe(`/users/${user}`, handler)

    return () => client.unsubscribe(`/users/${user}`, handler)
  }

  return {
    onUserNotification
  }
}
