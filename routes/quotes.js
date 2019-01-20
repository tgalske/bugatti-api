var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
const mysql = require('../mysql-wrapper');
const uuidv1 = require('uuid/v1');

// constants
const QUOTES_TABLE_NAME = 'quotes';
const MEMBERS_TABLE_NAME = 'members';

const TABLE_KEYS = ['quote_text', 'target_member_id', 'author_member_id', 'content_id'];

/* GET all quotes. */
router.get('/', function(req, res) {
  getAllQuotes( (payload) => res.send(payload));
});

/* GET a single quote */
router.get('/:quote_id', (req, res) => {
  const quote_id = req.params.quote_id;
  getQuote(quote_id, (payload) => res.send(payload));
});

/* GET all quotes by a member */
router.get('/member/:member_id', (req, res) => {
  const member_id = req.params.member_id;
  getQuotesByMember(member_id, (payload) => {res.send(payload)});
});

/* POST a new quote */
router.post('/', (req, res) => {
  createQuote(req.body, (payload) => res.send(payload));
});

/* PUT updated properties on a single quote */
router.put('/:quote_id', (req, res) => {
  const quote_id = req.params.quote_id;
  updateQuote(quote_id, req.body, (payload) => res.send(payload));
});

/* DELETE a quote by ID */
router.delete('/:quote_id', (req, res) => {
  const quote_id = req.params.quote_id;
  deleteQuote(quote_id, (payload) => res.send(payload));
});

// FUNCTIONS

/* Get all quotes */
function getAllQuotes(callback) {
  const queryStatement = 'SELECT ' + QUOTES_TABLE_NAME + '.*, ' + MEMBERS_TABLE_NAME + '.firstname, ' +
    MEMBERS_TABLE_NAME + '.nickname' +
    ' FROM ' + QUOTES_TABLE_NAME + ', ' + MEMBERS_TABLE_NAME +
    ' WHERE ' + QUOTES_TABLE_NAME + '.target_member_id = ' + MEMBERS_TABLE_NAME + '.member_id' +
    ' ORDER BY ' + QUOTES_TABLE_NAME + '.quote_id DESC';
  mysql.query(queryStatement, (error, results) => {
    if (error) {
      callback(error);
    } else {
      callback(results);
    }
  });
}

/* Get a single quote by its ID */
function getQuote(quote_id, callback) {
  const queryStatement = 'SELECT * FROM ' + QUOTES_TABLE_NAME +
    ' WHERE ' + QUOTES_TABLE_NAME + '.quote_id = ?';
  mysql.query(queryStatement, [quote_id], (error, results) => {
    if (error) {
      callback(error);
    } else {
      callback(results[0]);
    }
  });
}

/* Get all quotes by a single member */
function getQuotesByMember(member_id, callback) {
  const queryStatement = 'SELECT * FROM ' + QUOTES_TABLE_NAME +
    ' WHERE ' + QUOTES_TABLE_NAME + '.target_member_id = ?';
  mysql.query(queryStatement, [member_id], (error, results) => {
    if (error) {
      callback(error);
    } else {
      callback(results);
    }
  });
}

/* Create a new quote */
function createQuote(quoteInformation, callback) {
  var cleanedQuoteInformation = {};
  cleanedQuoteInformation.quote_id = uuidv1();

  TABLE_KEYS.forEach( currentKey => {
    cleanedQuoteInformation[currentKey] = quoteInformation[currentKey] ? quoteInformation[currentKey] : null;
  });

  const queryStatement = 'INSERT INTO ' + QUOTES_TABLE_NAME + ' SET ?';
  mysql.query(queryStatement, [cleanedQuoteInformation], (error, result) => {
    if (error) {
      callback(error);
    } else {
      callback(result);
    }
  });
}

/* Update a quote */
function updateQuote(quote_id, updatesToPerform, callback) {
  var cleanedUpdates = {};
  TABLE_KEYS.forEach( currentKey => {
    if (updatesToPerform[currentKey]) {
      cleanedUpdates[currentKey] = updatesToPerform[currentKey];
    }
  });

  // return if there are zero matching keys
  if (Object.keys(cleanedUpdates).length === 0) {
    callback({ success: false, error: "Zero corrct column names"});
    return;
  }

  const queryStatement = 'UPDATE ' + QUOTES_TABLE_NAME +
    ' SET ? ' +
    ' WHERE ' + QUOTES_TABLE_NAME + '.quote_id = ?';

  mysql.query(queryStatement, [cleanedUpdates, quote_id], (error, results) => {
    if (error) {
      callback(error);
    } else {
      callback(results);
    }
  });
}

function deleteQuote(quote_id, callback) {
  const queryStatement = 'DELETE FROM ' + QUOTES_TABLE_NAME + ' WHERE quote_id = ?';
  mysql.query(queryStatement, [quote_id], (error, results) => {
    if (error) {
      callback(error);
    } else {
      callback(results);
    }
  });
}

module.exports = {
  router: router,
  getQuotesByMember: getQuotesByMember
};