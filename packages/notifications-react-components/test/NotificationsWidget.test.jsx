import React from 'react'
import { mount } from 'enzyme'

import { NotificationsProvider } from '../src/components/NotificationsProvider'
import { NotificationsWidget } from '../src/components/NotificationsWidget'
import { NotificationsBox } from '../src/components/NotificationsBox'
import { NotificationsList, NotificationsListBase } from '../src/components/NotificationsList'

export async function delay(timeout = 10) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

const mockWebSocketService = ({ subscriptionError = false } = {}) => {
  let called = 0
  let user
  let callback

  return {
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

describe('NotificationsWidget', () => {
  let wrapper
  let service

  beforeEach(() => {
    service = mockWebSocketService()
    wrapper = mount(
      <NotificationsProvider userIdentifier="test" service={service}>
        <NotificationsWidget />
      </NotificationsProvider>
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

  test('click on remove button will remove the nitification', async () => {
    await delay()

    service.getCallback()({ type: 'new', payload: { id: 1, notify: { content: 'hello', url: 'someurl' } } })
    expect(wrapper.find(NotificationsBox).length).toBe(1)
    wrapper.instance().toggleList()
    wrapper.update()
    await delay()
    expect(wrapper.find(NotificationsList).length).toBe(1)
    wrapper.find('div.notifications-list-item button').simulate('click')
    expect(wrapper.state().notifications).toEqual([])
  })

  test('If a NotificationItem is passed is used intead of the default', async () => {
    wrapper = mount(
      <NotificationsProvider
        userIdentifier="test"
        service={service}
        NotificationItem={() => <div className="alt-item" />}
      >
        <NotificationsWidget />
      </NotificationsProvider>
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
      <NotificationsProvider userIdentifier="test">
        <NotificationsWidget />
      </NotificationsProvider>
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
