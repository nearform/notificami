import React from 'react'
import { mount } from 'enzyme'

import { NotificamiProvider } from '../src/components/NotificamiProvider'
import { NotificamiWidget } from '../src/components/NotificamiWidget'
import { NotificationsBox } from '../src/components/NotificationsBox'
import { NotificationsList, NotificationsListBase } from '../src/components/NotificationsList'

export async function delay(timeout = 10) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

const mockWebSocketService = ({
  subscriptionError = false,
  getNotifications = async () => {},
  removeNotification = async () => {},
  setNotificationRead = async () => {},
  setNotificationUnread = async () => {}
} = {}) => {
  let called = 0
  let user
  let callback

  return {
    getNotifications,
    removeNotification,
    setNotificationRead,
    setNotificationUnread,
    onUserNotification: async (u, c) => {
      called++

      if (subscriptionError) {
        throw new Error('Subscription error')
      }

      user = u
      callback = c

      return async () => {}
    },
    getCalled: () => {
      return called
    },
    getUser: () => {
      return user
    },
    getCallback: () => {
      return callback
    }
  }
}

describe('NotificamiWidget', () => {
  let wrapper
  let service

  beforeEach(() => {
    service = mockWebSocketService()
    wrapper = mount(
      <NotificamiProvider userIdentifier="test" service={service}>
        <NotificamiWidget />
      </NotificamiProvider>
    )
  })

  test('when the component is mounted it should have the Notification Box but not the list', async () => {
    await delay()

    expect(wrapper.find(NotificationsBox).length).toBe(1)
    expect(wrapper.find(NotificationsList).length).toBe(0)
  })

  test('after a toggle action it should have the list and the list is empty', async () => {
    await delay()

    expect(wrapper.find(NotificationsBox).length).toBe(1)
    wrapper.instance().toggleList()
    wrapper.update()
    await delay()
    expect(wrapper.find(NotificationsList).length).toBe(1)
    expect(wrapper.find('p.no-items').length).toBe(1)
  })

  test('after adding a notification the list should not be empty', async () => {
    await delay()

    service.getCallback()({ type: 'new', payload: { id: 1, notify: { content: 'hello' } } })
    expect(wrapper.find(NotificationsBox).length).toBe(1)
    wrapper.instance().toggleList()
    wrapper.update()
    await delay()
    expect(wrapper.find(NotificationsList).length).toBe(1)
    expect(wrapper.find('div.notifications-list-item').length).toBe(1)
  })

  test('click on remove button will remove the notification', async () => {
    await delay()

    service.getCallback()({ type: 'new', payload: { id: 1, notify: { content: 'hello', url: 'someurl' } } })
    expect(wrapper.find(NotificationsBox).length).toBe(1)
    wrapper.instance().toggleList()
    wrapper.update()
    await delay()
    expect(wrapper.find(NotificationsList).length).toBe(1)
    wrapper.find('div.notifications-list-item button.btn-remove').simulate('click')
    await delay()
    expect(wrapper.state().notifications).toEqual([])
  })

  test('click on setRead button will set the notification read', async () => {
    const setNotificationReadMock = jest.fn()
    const now = Date.now()
    setNotificationReadMock.mockReturnValueOnce({ id: 1, notify: { content: 'hello', url: 'someurl' }, readAt: now })
    service = mockWebSocketService({ setNotificationRead: setNotificationReadMock })
    wrapper = mount(
      <NotificamiProvider userIdentifier="test" service={service}>
        <NotificamiWidget />
      </NotificamiProvider>
    )
    await delay()

    service.getCallback()({
      type: 'new',
      payload: { id: 1, notify: { content: 'hello', url: 'someurl' }, readAt: null }
    })
    expect(wrapper.find(NotificationsBox).length).toBe(1)
    wrapper.instance().toggleList()
    wrapper.update()
    await delay()
    expect(wrapper.find(NotificationsList).length).toBe(1)
    wrapper.find('div.notifications-list-item button.btn-read').simulate('click')
    await delay()
    expect(wrapper.state().notifications).toEqual([
      { id: 1, notify: { content: 'hello', url: 'someurl' }, readAt: now }
    ])
  })

  test('click on setUnread button will set the notification unread', async () => {
    const setNotificationUnreadMock = jest.fn()
    const now = Date.now()
    setNotificationUnreadMock.mockReturnValueOnce({ id: 1, notify: { content: 'hello', url: 'someurl' }, readAt: null })
    service = mockWebSocketService({ setNotificationUnread: setNotificationUnreadMock })
    wrapper = mount(
      <NotificamiProvider userIdentifier="test" service={service}>
        <NotificamiWidget />
      </NotificamiProvider>
    )
    await delay()

    service.getCallback()({
      type: 'new',
      payload: { id: 1, notify: { content: 'hello', url: 'someurl' }, readAt: now }
    })
    expect(wrapper.find(NotificationsBox).length).toBe(1)
    wrapper.instance().toggleList()
    wrapper.update()
    await delay()
    expect(wrapper.find(NotificationsList).length).toBe(1)
    wrapper.find('div.notifications-list-item button.btn-unread').simulate('click')
    await delay()
    expect(wrapper.state().notifications).toEqual([
      { id: 1, notify: { content: 'hello', url: 'someurl' }, readAt: null }
    ])
  })

  test('If a NotificationItem is passed is used intead of the default', async () => {
    wrapper = mount(
      <NotificamiProvider userIdentifier="test" service={service} NotificationItem={() => <div className="alt-item" />}>
        <NotificamiWidget />
      </NotificamiProvider>
    )
    await delay()

    service.getCallback()({ type: 'new', payload: { id: 1, notify: { content: 'hello' } } })
    expect(wrapper.find(NotificationsBox).length).toBe(1)
    wrapper.instance().toggleList()
    wrapper.update()
    await delay()
    expect(wrapper.find(NotificationsList).length).toBe(1)
    expect(wrapper.find('div.alt-item').length).toBe(1)
  })

  test('without a service the list should show the service disabled message', async () => {
    wrapper = mount(
      <NotificamiProvider userIdentifier="test">
        <NotificamiWidget />
      </NotificamiProvider>
    )
    await delay()

    expect(wrapper.find(NotificationsBox).length).toBe(1)
    wrapper.instance().toggleList()
    wrapper.update()
    await delay()
    expect(wrapper.find('p.not-active').length).toBe(1)
  })

  test('click outside the wrapper will close the list', async () => {
    const mockClose = jest.fn()
    wrapper = mount(<NotificationsListBase closeList={mockClose} />)
    wrapper.instance().handleClickOutside({ srcElement: { className: 'some class' } })
    expect(mockClose).toHaveBeenCalled()
    mockClose.mockClear()
    wrapper.instance().handleClickOutside({ srcElement: { className: 'notifications-box' } })
    expect(mockClose).not.toHaveBeenCalled()
  })
})
