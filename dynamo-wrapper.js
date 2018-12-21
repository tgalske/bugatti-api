var AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();

module.exports = dynamo;
