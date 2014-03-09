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
    'update-time': new Date('Sat Dec 03 2011 00:00:00 GMT+0200 (IST)') },
  { first: '',
    last: 'last2-changed',
    phone: 654321,
    email: 'email2',
    enabled: true,
    'update-time': new Date('Mon Jan 28 1980 00:00:00 GMT+0200 (IST)') },
  { first: 'first3',
    last: 'another last',
    phone: 34567,
    email: 'email3-update1',
    enabled: false,
    'update-time': new Date('Wed Mar 23 2011 23:30:00 GMT+0200 (IST)') } ]);
});