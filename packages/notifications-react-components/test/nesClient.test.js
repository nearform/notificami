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

  afterAll(async () => {
    await client.disconnect()
  })
})
