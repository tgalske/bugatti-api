var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const mysql = require('../mysql-wrapper');
const quotesRouter = require('./quotes');
const uuidv1 = require('uuid/v1');

// CONSTANTS
const MEMBERS_TABLE_NAME = 'members';
const TABLE_KEYS = ["firstname", "lastname", "nickname", "phone"];

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
      var memberResponse = promiseResponse[0][0];
      memberResponse.quotes = promiseResponse[1];
      res.send(memberResponse);
    });
});

/* POST a new member */
router.post('/', (req, res) => {
  createNewMember( req.body, (payload) => res.send(payload));
});

/* PUT updated properties on a single member */
router.put('/:member_id', (req, res) => {
  const targetMember = req.params.member_id;
  updateMember(targetMember, req.body, (payload) => res.send(payload));
});

/* DELETE a member by ID */
router.delete('/:member_id', (req, res) => {
  const member_id = req.params.member_id;
  deleteMember(member_id, (payload) => res.send(payload));
});


// FUNCTIONS


/* Get all members */
function getMembers(callback) {
  mysql.query('SELECT * FROM ' + MEMBERS_TABLE_NAME, function (error, results) {
    if (error) {
      callback(error);
    } else {
      callback(results);
    }
  });
}

/* Get a single member */
function getMember(member_id, callback) {
  mysql.query('SELECT * FROM ' + MEMBERS_TABLE_NAME +
    ' WHERE ' + MEMBERS_TABLE_NAME + '.member_id= ?', [member_id], (error, results) => {
    if (error) {
      callback(error);
    } else {
      callback(results);
    }
  });
}

/* Create a new member */
function createNewMember(memberInformation, callback) {

  var cleanedMemberInformation = {};
  cleanedMemberInformation.member_id = uuidv1();

  TABLE_KEYS.forEach( currentKey => {
    cleanedMemberInformation[currentKey] = memberInformation[currentKey] ? memberInformation[currentKey] : null;
  });

  const queryStatement = 'INSERT INTO ' + MEMBERS_TABLE_NAME + ' SET ?';
  mysql.query(queryStatement, [cleanedMemberInformation], (error, result) => {
    if (error) {
      callback(error);
    } else {
      callback(result);
    }
  });
}

/* Update a member */
function updateMember(member_id, updatesToPerform, callback) {
  var cleanedUpdates = {};
  TABLE_KEYS.forEach( currentKey => {
    if (updatesToPerform[currentKey]) {
      cleanedUpdates[currentKey] = updatesToPerform[currentKey];
    }
  });

  // return if there are zero
  if (Object.keys(cleanedUpdates).length === 0) {
    callback({ success: false, error: "Zero corrct column names"});
  }

  const queryStatement = 'UPDATE ' + MEMBERS_TABLE_NAME +
    ' SET ? ' +
    ' WHERE ' + MEMBERS_TABLE_NAME + '.member_id = ?';

  mysql.query(queryStatement, [cleanedUpdates, member_id], (error, results) => {
    if (error) {
      callback(error);
    } else {
      callback(results);
    }
  })
}

/* Delete a member */
function deleteMember(member_id, callback) {
  const queryStatement = 'DELETE FROM ' + MEMBERS_TABLE_NAME + ' WHERE member_id = ?';
  mysql.query(queryStatement, [member_id], (error, results) => {
    if (error) {
      callback(error);
    } else {
      callback(results);
    }
  });
}

module.exports = router;
