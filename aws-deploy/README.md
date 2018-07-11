# AWS infrastructure deploy

## Install

### Deploy the platform on AWS
The platform is deployed on AWS using `serverless` ([https://serverless.com/](https://serverless.com/))
The configuration for the Cloudformation process is set in the file `serverless.json`

#### A quick reference to configure AWS

##### Install and configure awscli on Mac

```brew install awscli```

awscli is not strictly required to deploy the infrastructure

##### Create a IAM
From the AWS panel create a User called `nearform-dev` that has access to the `AdministratorAccess`
(Use this at your own risk and limit acces in a production environment)

##### Add the profile in your `~/.aws/certificate` file

```
[default]
aws_access_key_id = AKDIxxxxxxxxxxxxxxxx
aws_secret_access_key = 6Y4zf4Nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

[nearform-dev]
aws_access_key_id = AKIAxxxxxxxxxxxxxxxx
aws_secret_access_key=6Y4zf4Nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

##### Change the profile in your environment
 * on Mac `export AWS_PROFILE=nearform-dev`
 * on Window `set AWS_PROFILE=nearform-dev`

 or add the `--profile nearform-dev` directly in the commandline (Eg. `aws ec2 describe-instances --profile nearform-dev`)

##### Add the region in your `~/.aws/config` file

```
[default]
region = eu-west-1

[profile nearform-dev]
region = eu-west-1
```

#### Install and deploy
Install the dependencies

```
npm install
```

Deploy the app

```
npm run deploy
```

The deploy process creates an AWS infrastracture using `serverless`.

* A DynamoDb table
* A Sqs queue
* A ManagedPolicy - To access the the SQS and DynamoDB
* A IAM User connected to the ManagedPolicies
* The AccessKey to use the User

Delete the app

```
npm run remove
```

## Deploy results
After the deploy operation a `stack.json` config file is created.

```
{
  "TableName": "notifications-dev",
  "ApplicationUserAccessKey": "AKIAJVUSIUSERACCESSKEY",
  "Region": "eu-west-1",
  "DynamoTableARN": "arn:aws:dynamodb:eu-west-1:1234567890:table/notifications-dev",
  "ApplicationUserSecretAccessKey": "c9AHgAjhpsercretuseraccesskey",
  "ServerlessDeploymentBucketName": "notifications-dev-serverlessdeploymentbucket-1234567890",
  "SQSQueueName": "notifications-dev-queue.fifo",
  "SQSQueueARN": "arn:aws:sqs:eu-west-1:2133312765127635:notifications-dev-queue.fifo",
  "SQSQueueURL": "https://sqs.eu-west-1.amazonaws.com/2133312765127635/notifications-dev-queue.fifo",
}
```
