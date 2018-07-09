const DynamoDbLocal = require('dynamodb-local')
const dynamoLocalPort = 8000

async function start() {
  console.log('DynamoDbLocal: start') // eslint-disable-line
  await DynamoDbLocal.launch(dynamoLocalPort, null, [], false, true) // must be wrapped in async function
  console.log('DynamoDbLocal: started on port', dynamoLocalPort) // eslint-disable-line
}

start()
