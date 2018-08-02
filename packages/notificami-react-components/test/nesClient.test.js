describe('WebsocketService', () => {
  let mockNesClient
  let client
  let service
  let mockConnect
  let mockRequest
  let mockSubscribe
  let mockUnsubscribe

  let firstTest = false
  beforeEach(async () => {
    if (!firstTest) {
      mockConnect = jest.fn()
      mockRequest = jest.fn()
      mockSubscribe = jest.fn()
      mockUnsubscribe = jest.fn()

      mockNesClient = function() {
        this.connect = mockConnect
        this.request = mockRequest
        this.subscribe = mockSubscribe
        this.unsubscribe = mockUnsubscribe
      }

      jest.mock('nes', () => ({
        Client: mockNesClient
      }))

      client = require('../src/nesClient').buildWebsocketClient('ws://localhost/')
      await client.connect()
      service = require('../src/nesClient').WebsocketService(client)
      firstTest = true
    } else {
      mockConnect.mockReset()
      mockRequest.mockReset()
      mockSubscribe.mockReset()
      mockUnsubscribe.mockReset()
    }
  })

  test('Subscribe on the user', async () => {
    const user = 'test'

    const handler = jest.fn()
    const unsubscribe = await service.onUserNotification(user, handler)

    expect(mockSubscribe.mock.calls.length).toEqual(1)
    expect(mockSubscribe.mock.calls[0][0]).toEqual('/users/test')

    await unsubscribe()
    expect(mockUnsubscribe).toHaveBeenCalledWith('/users/test', handler)
  })

  test('Call the removeNotifications', async () => {
    await service.removeNotification({ id: 'not-1' })

    expect(mockRequest.mock.calls.length).toEqual(1)
    expect(mockRequest.mock.calls[0][0]).toEqual({ method: 'DELETE', path: '/notifications/not-1' })
  })

  test('Call the getNotifications', async () => {
    const response = {
      payload: [
        {
          id: 3,
          notify: {},
          readAt: null
        }
      ]
    }
    mockRequest.mockReturnValue(response)
    const result = await service.getNotifications('davide')
    expect(mockRequest.mock.calls.length).toEqual(1)
    expect(mockRequest.mock.calls[0][0]).toEqual('/users/davide/notifications')
    expect(result).toEqual(response.payload)
  })

  test('Call the getNotifications with offsetId', async () => {
    const response = {
      payload: [
        {
          id: 3,
          notify: {},
          readAt: null
        }
      ]
    }
    mockRequest.mockReturnValue(response)
    const result = await service.getNotifications('davide', 5)
    expect(mockRequest.mock.calls.length).toEqual(1)
    expect(mockRequest.mock.calls[0][0]).toEqual('/users/davide/notifications/5')
    expect(result).toEqual(response.payload)
  })

  test('Call the setNotificationUnread', async () => {
    const response = {
      payload: {
        id: 3,
        notify: {},
        readAt: null
      }
    }
    mockRequest.mockReturnValue(response)
    const result = await service.setNotificationUnread({ id: 'not-1' })
    expect(mockRequest.mock.calls.length).toEqual(1)
    expect(mockRequest.mock.calls[0][0]).toEqual({ method: 'PUT', path: '/notifications/not-1/unread' })
    expect(result).toEqual(response.payload)
  })

  test('Call the setNotificationRead', async () => {
    const response = {
      payload: {
        id: 3,
        notify: {},
        readAt: Date.now()
      }
    }
    mockRequest.mockReturnValue(response)
    const result = await service.setNotificationRead({ id: 'not-1' })
    expect(mockRequest.mock.calls.length).toEqual(1)
    expect(mockRequest.mock.calls[0][0]).toEqual({ method: 'PUT', path: '/notifications/not-1/read' })
    expect(result).toEqual(response.payload)
  })

  afterAll(async () => {
    await client.disconnect()
  })
})
