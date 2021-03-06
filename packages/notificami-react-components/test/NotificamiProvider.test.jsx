import { mount } from 'enzyme'
import React from 'react'
import { NotificamiProvider, NotificationsWrapper, NotificationsContext } from '../src/components/NotificamiProvider'

export async function delay(timeout = 10) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

function PropsChildren(props) {
  return <span>test</span>
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

describe('NotificamiProvider', () => {
  let wrapper
  let service

  beforeEach(() => {
    service = mockWebSocketService()
    wrapper = mount(
      <NotificamiProvider userIdentifier="test" service={service}>
        <div />
      </NotificamiProvider>
    )
  })

  describe('lifecycle', () => {
    test('when the component is mounted it should subscribe to the user notifications', async () => {
      await delay()

      expect(service.getCalled()).toEqual(1)
      wrapper.unmount()
    })

    test('On subscription the notification list is initialized', async () => {
      await delay()

      service.getCallback()({
        type: 'init',
        payload: { items: [{ id: 1, notify: { content: 'some content' } }], hasMore: true }
      })
      expect(wrapper.state().notifications).toEqual([{ id: 1, notify: { content: 'some content' } }])
      expect(wrapper.state().active).toEqual(true)
      expect(wrapper.state().hasMore).toEqual(true)

      wrapper.unmount()
    })

    test('If the notification type is unknow nothing happen', async () => {
      await delay()

      service.getCallback()({
        type: 'another',
        payload: {}
      })
      wrapper.unmount()
    })

    test('When a new communication comes from the socket, the callback is called and the status updated', async () => {
      await delay()

      service.getCallback()({ type: 'new', payload: { id: 'hello' } })
      expect(wrapper.state().notifications).toEqual([{ id: 'hello' }])
      expect(wrapper.state().active).toEqual(true)

      wrapper.setProps({ userIdentifier: 'test2' })
      await delay()

      service.getCallback()({ type: 'new', payload: { id: 'hello2' } })
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
        <NotificamiProvider userIdentifier="test">
          <div />
        </NotificamiProvider>
      )

      await delay()

      expect(wrapper.state().active).toEqual(false)
      wrapper.unmount()
    })

    test('a notification can be removed', async () => {
      await delay()

      service.getCallback()({ type: 'new', payload: { id: 1, notify: { content: 'hello' } } })
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

      service.getCallback()({ type: 'new', payload: { id: 1, notify: { content: 'hello' } } })

      wrapper.state().removeNotificationFromList({ id: 2, notify: { content: 'hello 2' } })
      await delay()

      expect(wrapper.state().notifications).toEqual([{ id: 1, notify: { content: 'hello' } }])
      expect(wrapper.state().active).toEqual(true)

      wrapper.unmount()
    })

    test('removeNotification should handle the error in case of error', async () => {
      const removeNotificationMock = jest.fn()
      service = mockWebSocketService({ removeNotification: removeNotificationMock })

      const onErrorMock = jest.fn()
      wrapper = mount(
        <NotificamiProvider userIdentifier="test" service={service} onError={onErrorMock}>
          <div />
        </NotificamiProvider>
      )

      await delay()
      service.getCallback()({ type: 'new', payload: { id: 1, notify: { content: 'hello' } } })
      const error = new Error('some error')
      removeNotificationMock.mockImplementationOnce(() => {
        throw error
      })

      await wrapper.instance().removeNotificationFromList({ id: 1, notify: { content: 'hello' } })
      expect(onErrorMock).toHaveBeenCalledWith(error)
    })

    test('when the component is updated it should refresh the notification list', async () => {
      wrapper.setProps({ userIdentifier: 'test2' })
      await delay()

      expect(service.getCalled()).toEqual(2)
    })

    test('when there is an error subscribing the active flag is false', async () => {
      service = mockWebSocketService({ subscriptionError: true })
      wrapper = mount(
        <NotificamiProvider userIdentifier="test" service={service}>
          <div />
        </NotificamiProvider>
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
        <NotificamiProvider userIdentifier="test" service={service}>
          <div />
        </NotificamiProvider>
      )

      expect(wrapper.state().showList).toEqual(false)
      wrapper.instance().toggleList()
      expect(wrapper.state().showList).toEqual(true)
    })

    test('closeList', () => {
      wrapper = mount(
        <NotificamiProvider userIdentifier="test" service={service}>
          <div />
        </NotificamiProvider>
      )

      expect(wrapper.state().showList).toEqual(false)
      wrapper.instance().toggleList()
      wrapper.instance().closeList()
      expect(wrapper.state().showList).toEqual(false)
    })

    test('loadMore', async () => {
      const getNotificationsMock = jest.fn()
      service = mockWebSocketService({ getNotifications: getNotificationsMock })

      wrapper = mount(
        <NotificamiProvider userIdentifier="test" service={service}>
          <div />
        </NotificamiProvider>
      )

      getNotificationsMock.mockReturnValueOnce({
        items: [{ id: 2, notify: { content: 'some content' } }],
        hasMore: true
      })
      getNotificationsMock.mockReturnValueOnce({
        items: [{ id: 1, notify: { content: 'some content' } }],
        hasMore: true
      })
      getNotificationsMock.mockReturnValueOnce({
        items: [],
        hasMore: true
      })
      getNotificationsMock.mockRejectedValueOnce({ message: 'some error' })

      await wrapper.instance().loadMore()
      expect(wrapper.state().notifications).toEqual([{ id: 2, notify: { content: 'some content' } }])
      expect(wrapper.state().hasMore).toBeTruthy()

      await wrapper.instance().loadMore()
      expect(wrapper.state().notifications).toEqual([
        { id: 2, notify: { content: 'some content' } },
        { id: 1, notify: { content: 'some content' } }
      ])
      expect(wrapper.state().hasMore).toBeTruthy()

      await wrapper.instance().loadMore()
      expect(wrapper.state().notifications).toEqual([
        { id: 2, notify: { content: 'some content' } },
        { id: 1, notify: { content: 'some content' } }
      ])
      expect(wrapper.state().hasMore).toBeFalsy()

      await wrapper.instance().loadMore()
      expect(wrapper.state().notifications).toEqual([
        { id: 2, notify: { content: 'some content' } },
        { id: 1, notify: { content: 'some content' } }
      ])
      expect(wrapper.state().hasMore).toBeFalsy()
      expect(wrapper.state().loadMoreError).toBe('some error')
    })
  })

  test('loadMore should call the handleError in case of error', async () => {
    const getNotificationsMock = jest.fn()
    service = mockWebSocketService({ getNotifications: getNotificationsMock })

    const onErrorMock = jest.fn()
    wrapper = mount(
      <NotificamiProvider userIdentifier="test" service={service} onError={onErrorMock}>
        <div />
      </NotificamiProvider>
    )

    const error = new Error('some error')
    getNotificationsMock.mockImplementationOnce(() => {
      throw error
    })

    await wrapper.instance().loadMore()
    expect(onErrorMock).toHaveBeenCalledWith(error)
  })
})
