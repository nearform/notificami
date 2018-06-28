'use strict'

async function notifyUser(notification) {
  const server = this

  const notifyToSend = {
    id: notification.id,
    notify: notification.notify,
    createdAt: notification.createdAt
  }

  let isUserSubscribed = false
  server.eachSocket(
    () => {
      isUserSubscribed = true
    },
    { subscription: `/users/${notification.userIdentifier}` }
  )

  if (!isUserSubscribed) {
    throw new Error('User not subscribed')
  }

  // TODO Find a way to check if the message is delivered, an ACK message from the client can be a solution
  await server.publish(`/users/${notification.userIdentifier}`, notifyToSend)
}

module.exports = {
  notifyUser
}
