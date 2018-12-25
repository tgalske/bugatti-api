var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const dynamo = require('../dynamo-wrapper');

// constants
const QUOTES_TABLE_NAME = 'Quotes';
const RESPONSE_SUCCESS = {success : true};
const RESPONSE_FAILURE = {success: false};

var responsePackage = {};

/* GET all quotes. */
router.get('/', function(req, res) {
  dynamo.scan({ TableName: QUOTES_TABLE_NAME}, (err, data) => {
    if (err) {
      Object.assign(err, RESPONSE_FAILURE);
      res.send(err);
    } else {
      Object.assign(data, RESPONSE_SUCCESS);
      res.send(data);
    }
  });
});

/* GET a single quote */
router.get('/:quote_id', (req, res) => {

  const params = {
    TableName: QUOTES_TABLE_NAME,
    Key: {
      "quote_id": req.params.quote_id,
    }
  };
  dynamo.getItem(params, (err, data) => {
    if (err) {
      Object.assign(err, RESPONSE_FAILURE);
      res.send(err);
    } else {
      Object.assign(data, RESPONSE_SUCCESS);
      res.send(data);
    }
  });
});

/* GET all quotes by a member */
router.get('/member/:member_id', (req, res) => {
  const member_id = req.params.member_id;
  getQuotesByMember(member_id, (payload) => {res.send(payload)});

});

/* POST a new quote */
router.post('/', (req, res) => {

  const uuidv1 = require('uuid/v1');

  var newItem = req.body;
  newItem.quote_id = uuidv1();

  const newQuote = {
    "TableName" : QUOTES_TABLE_NAME,
    "Item" : newItem
  };
  dynamo.putItem(newQuote, (err, data) => {
    if (err) {
      Object.assign(err, RESPONSE_FAILURE);
      res.send(err);
    } else {
      Object.assign(data, RESPONSE_SUCCESS);
      res.send(data);
    }
  });

});

/* PUT updated properties on a single quote */
router.put('/:quote_id', (req, res) => {
  const targetQuote = req.params.quote_id;
  const updatesToPerform = Object.entries(req.body); // array of key:value

  const requests = updatesToPerform.map((update) => {
    return new Promise((resolve) => performPut(targetQuote, update, resolve));
  });

  Promise.all(requests)
    .catch( () => res.send(RESPONSE_FAILURE))
    .then(() => res.send(RESPONSE_SUCCESS));
});

/* helper method for PUT requests that updates a single key:value pair in the database */
function performPut(targetQuote, keyValuePair, callback) {
  const key = keyValuePair[0];
  const newValue = keyValuePair[1];

  var updateQuery = {
    "TableName" : QUOTES_TABLE_NAME,
    "Key" : {
      "quote_id" : targetQuote
    },
    "UpdateExpression" : {},
    "ExpressionAttributeValues" : {}
  };

  // syntax: set firstname = :firstname
  updateQuery.UpdateExpression = "set " + key + " = :" + key;

  // syntax: :firstname
  const targetKey = ":" + key;

  // syntax: ":firstname" : firstname
  updateQuery.ExpressionAttributeValues[targetKey] = newValue;
  dynamo.updateItem(updateQuery, (err, data) => {});

  callback();
}

/* DELETE a quote by ID */
router.delete('/:quote_id', (req, res) => {
  const targetQuote = req.params.quote_id;
  const deleteQuery = {
    "TableName" : QUOTES_TABLE_NAME,
    "Key" : {
      "quote_id" : targetQuote
    }
  };
  dynamo.deleteItem(deleteQuery, (err, data) => {
    if (err) {
      Object.assign(err, RESPONSE_FAILURE);
      res.send(err);
    } else {
      Object.assign(data, RESPONSE_SUCCESS);
      res.send(data);
    }
  });
});

// FUNCTIONS

function getQuotesByMember(member_id, callback) {
  const params = {
    TableName: QUOTES_TABLE_NAME,
    FilterExpression: '#target = :member',
    ExpressionAttributeNames: {
      '#target': 'target_member_id',
    },
    ExpressionAttributeValues: {
      ':member': member_id,
    },
  };

  dynamo.scan(params, (err, data) => {
    if (err) {
      Object.assign(err, RESPONSE_FAILURE);
      callback(err);
    } else {
      Object.assign(data, RESPONSE_SUCCESS);
      callback(data);
    }
  });
};

module.exports = {
  router: router,
  getQuotesByMember: getQuotesByMember
};