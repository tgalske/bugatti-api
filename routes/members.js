var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const dynamo = require('../dynamo-wrapper');
const quotesRouter = require('./quotes');


// CONSTANTS
const MEMBERS_TABLE_NAME = 'Members';
const QUOTES_TABLE_NAME = 'Quotes';
const RESPONSE_SUCCESS = {success : true};
const RESPONSE_FAILURE = {success: false};


// ROUTES

/* GET all members. */
router.get('/', function(req, res) {
  getMembers((payload) => res.send(payload));
});

/* GET a single member with quotes*/
router.get('/:member_id', (req, res) => {
  const member_id = req.params.member_id;

  Promise.all([
    new Promise( (resolve) => {
      getMember(member_id, (memberPayload) => {
        resolve(memberPayload);
      });
    }),
    new Promise( resolve => {
      quotesRouter.getQuotesByMember(member_id, (quotesPayload) => {
        resolve(quotesPayload);
      });
    })
  ])
    .then( (promiseResponse) => {
      var memberResponse = promiseResponse[0].Item;
      memberResponse.quotes = promiseResponse[1].Items;
      res.send(memberResponse);
    });
});

/* POST a new member */
router.post('/', (req, res) => {
  createNewMember( (payload) => res.send(payload));
});

/* PUT updated properties on a single member */
router.put('/:member_id', (req, res) => {
  const targetMember = req.params.member_id;
  const updatesToPerform = Object.entries(req.body); // array of key:value

  const requests = updatesToPerform.map((update) => {
    return new Promise((resolve) => performPut(targetMember, update, resolve));
  });

  Promise.all(requests)
    .catch( () => res.send(RESPONSE_FAILURE))
    .then(() => res.send(RESPONSE_SUCCESS));
});

/* helper method for PUT requests that updates a single key:value pair in the database */
function performPut(targetMember, keyValuePair, callback) {
  const key = keyValuePair[0];
  const newValue = keyValuePair[1];

  var updateQuery = {
    "TableName" : MEMBERS_TABLE_NAME,
    "Key" : {
      "member_id" : targetMember
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

/* DELETE a member by ID */
router.delete('/:member_id', (req, res) => {
  const member_id = req.params.member_id;
  deleteMember(member_id, (payload) => res.send(payload));
});


// FUNCTIONS


/* Get all members */
function getMembers(callback) {
  const params = {
    TableName: MEMBERS_TABLE_NAME
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

}

/* Get a single member */
function getMember(member_id, callback) {
  const params = {
    TableName: MEMBERS_TABLE_NAME,
    Key: {
      "member_id": member_id,
    }
  };
  dynamo.getItem(params, (err, data) => {
    if (err) {
      Object.assign(err, RESPONSE_FAILURE);
      callback(err);
    } else {
      Object.assign(data, RESPONSE_SUCCESS);
      callback(data);
    }
  });
}

/* Create a new member */
function createNewMember(callback) {
  const uuidv1 = require('uuid/v1');

  var newItem = req.body;
  newItem.member_id = uuidv1();

  const params = {
    "TableName" : MEMBERS_TABLE_NAME,
    "Item" : newItem
  };
  dynamo.putItem(params, (err, data) => {
    if (err) {
      Object.assign(err, RESPONSE_FAILURE);
      callback(err);
    } else {
      Object.assign(data, RESPONSE_SUCCESS);
      callback(data);
    }
  });
}

/* Delete a member */
function deleteMember(member_id, callback) {
  const params = {
    "TableName" : MEMBERS_TABLE_NAME,
    "Key" : {
      "member_id" : member_id
    }
  };
  dynamo.deleteItem(params, (err, data) => {
    if (err) {
      Object.assign(err, RESPONSE_FAILURE);
      callback(err);
    } else {
      Object.assign(data, RESPONSE_SUCCESS);
      callback(data);
    }
  });
}

module.exports = router;
