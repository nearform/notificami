import { mount } from 'enzyme'
import React from 'react'
import {
  NotificationsProvider,
  NotificationsWrapper,
  NotificationsContext
} from '../src/components/NotificationsProvider'

export async function delay(timeout = 10) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

function PropsChildren(props) {
  return <span>test</span>
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

describe('NotificationsProvider', () => {
  let wrapper
  let service

  beforeEach(() => {
    service = mockWebSocketService()
    wrapper = mount(
      <NotificationsProvider userIdentifier="test" service={service}>
        <div />
      </NotificationsProvider>
    )
  })

  describe('lifecycle', () => {
    test('when the component is mounted it should subscribe to the user notifications', async () => {
      await delay()

      expect(service.getCalled()).toEqual(1)
      wrapper.unmount()
    })

    test('When a new communication comes from the socket, the callback is called and the status updated', async () => {
      await delay()

      service.getCallback()({ id: 'hello' })
      expect(wrapper.state().notifications).toEqual([{ id: 'hello' }])
      expect(wrapper.state().active).toEqual(true)

      wrapper.setProps({ userIdentifier: 'test2' })
      await delay()

      service.getCallback()({ id: 'hello2' })
      expect(wrapper.state().notifications).toEqual([{ id: 'hello2' }])
      expect(wrapper.state().active).toEqual(true)

      wrapper.unmount()
    })

    test('When updating props with no servie the status should be inactive', async () => {
      wrapper.setProps({ service: undefined })
      await delay()

      expect(wrapper.state().active).toEqual(false)

      wrapper.unmount()
    })

    test('When passing no servie the status should be inactive', async () => {
      wrapper = mount(
        <NotificationsProvider userIdentifier="test">
          <div />
        </NotificationsProvider>
      )

      await delay()

      expect(wrapper.state().active).toEqual(false)
      wrapper.unmount()
    })

    test('a notification can be removed', async () => {
      await delay()

      service.getCallback()({ id: 1, notify: { content: 'hello' } })
      expect(wrapper.state().notifications).toEqual([{ id: 1, notify: { content: 'hello' } }])
      expect(wrapper.state().active).toEqual(true)

      wrapper.state().removeNotificationFromList({ id: 1, notify: { content: 'hello' } })
      await delay()

      expect(wrapper.state().notifications).toEqual([])
      expect(wrapper.state().active).toEqual(true)

      wrapper.unmount()
    })

    test('a notification will not be removed if not present', async () => {
      await delay()

      service.getCallback()({ id: 1, notify: { content: 'hello' } })

      wrapper.state().removeNotificationFromList({ id: 2, notify: { content: 'hello 2' } })
      await delay()

      expect(wrapper.state().notifications).toEqual([{ id: 1, notify: { content: 'hello' } }])
      expect(wrapper.state().active).toEqual(true)

      wrapper.unmount()
    })

    test('when the component is updated it should refresh the notification list', async () => {
      wrapper.setProps({ userIdentifier: 'test2' })
      await delay()

      expect(service.getCalled()).toEqual(2)
    })

    test('when there is an error subscribing the active flag is false', async () => {
      service = mockWebSocketService({ subscriptionError: true })
      wrapper = mount(
        <NotificationsProvider userIdentifier="test" service={service}>
          <div />
        </NotificationsProvider>
      )
      await delay()

      expect(service.getCalled()).toEqual(2)
      expect(wrapper.state().active).toEqual(false)
      wrapper.instance().setState({ active: true })
      expect(wrapper.state().active).toEqual(true)
      await delay()
      expect(wrapper.state().active).toEqual(false)
    })

    test('wrapping into a NotificationsWrapper', async () => {
      const NotificationsComponent = NotificationsWrapper(PropsChildren)

      mount(
        <div>
          <NotificationsContext.Provider value={{ test: 'test' }}>
            <NotificationsComponent />
          </NotificationsContext.Provider>
        </div>
      )
    })
  })

  describe('actions', () => {
    test('toggleList', () => {
      wrapper = mount(
        <NotificationsProvider userIdentifier="test" service={service}>
          <div />
        </NotificationsProvider>
      )

      expect(wrapper.state().showList).toEqual(false)
      wrapper.instance().toggleList()
      expect(wrapper.state().showList).toEqual(true)
    })

    test('closeList', () => {
      wrapper = mount(
        <NotificationsProvider userIdentifier="test" service={service}>
          <div />
        </NotificationsProvider>
      )

      expect(wrapper.state().showList).toEqual(false)
      wrapper.instance().toggleList()
      wrapper.instance().closeList()
      expect(wrapper.state().showList).toEqual(false)
    })
  })
})
