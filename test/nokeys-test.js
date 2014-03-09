var fs = require('fs');
var path = require('path');
var assert = require('assert');
var util = require('util');

var csvdb = require('..');

var tmpfile = '/tmp/csvdb-nokeys-test.csv';

fs.writeFileSync(tmpfile, fs.readFileSync(path.join(__dirname, 'nokeys.csv')));

var db = csvdb(tmpfile, function(err, e) {
  assert(e);
  assert(util.isArray(e));
  assert.equal(e.length, 3);
  assert.deepEqual(e, [ { first: 'elad',
    last: 'benisrael',
    phone: 387383833,
    email: 'elad.benisrael@gmail.com',
    enabled: true,
    'update-time': new Date(Date.parse('2011-12-3')) },
  { first: '',
    last: 'last2-changed',
    phone: 654321,
    email: 'email2',
    enabled: true,
    'update-time': new Date(Date.parse('1980-1-28')) },
  { first: 'first3',
    last: 'another last',
    phone: 34567,
    email: 'email3-update1',
    enabled: false,
    'update-time': new Date(Date.parse('2011-3-23 23:30:00')) } ]);
});