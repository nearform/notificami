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
    socket => {
      if (!isUserSubscribed) {
        isUserSubscribed = !!socket._subscriptions[`/users/${notification.userIdentifier}`]
      }
    }
    // @see https://github.com/hapijs/nes/issues/248
    // ,
    // { subscription: `/users/${notification.userIdentifier}` }
  )

  // This is needed beacuse notif.me sdk requires a rejected promise to mark a provider as unsuccessful.
  if (!isUserSubscribed) {
    throw new Error('User not subscribed')
  }

  // TODO Find a way to check if the message is delivered, an ACK message from the client can be a solution
  await server.publish(`/users/${notification.userIdentifier}`, { type: 'new', payload: notifyToSend })
}

module.exports = {
  notifyUser
}
