var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const dynamo = require('../dynamo-wrapper');

// constants
const MEMBERS_TABLE_NAME = 'Members';
const RESPONSE_SUCCESS = {success : true};
const RESPONSE_FAILURE = {success: false};

/* GET all members. */
router.get('/', function(req, res, next) {
  dynamo.scan({ TableName: MEMBERS_TABLE_NAME}, (err, data) => {
    if (err) {
      res.send(err);
    } else {
      res.send(data.Items);
    }
  });
});


/* GET a single member */
router.get('/:member_id', (req, res) => {

  const params = {
    TableName: MEMBERS_TABLE_NAME,
    Key: {
      "member_id": req.params.member_id,
    }
  };
  dynamo.getItem(params, (err, data) => {
    if (err) {
      res.send(error);
    } else {
      res.send(data.Item);
    }
  });
});

/* POST a new member */
router.post('/', (req, res) => {
  const uuidv1 = require('uuid/v1');

  var newItem = req.body;
  newItem.member_id = uuidv1();

  const newMember = {
    "TableName" : MEMBERS_TABLE_NAME,
    "Item" : newItem
  };
  dynamo.putItem(newMember, (err, data) => {
    if (err) {
      res.send(err);
    } else {
      res.send(data);
    }
  });

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
  const targetMember = req.params.member_id;
  const deleteQuery = {
    "TableName" : MEMBERS_TABLE_NAME,
    "Key" : {
      "member_id" : targetMember
    }
  };
  dynamo.deleteItem(deleteQuery, (err, data) => {
    if (err) {
      res.send(RESPONSE_FAILURE);
    } else {
      res.send(RESPONSE_SUCCESS);
    }
  });
});

module.exports = router;
