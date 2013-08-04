var fs = require('fs');
var path = require('path');
var assert = require('assert');
var csvdb = require('..');

var tmpfile = '/tmp/csvdb-test.csv';

fs.writeFileSync(tmpfile, fs.readFileSync(path.join(__dirname, 'test.csv')));

var db = csvdb(tmpfile, { autofetch: 1000 });

db.once('fetch', function() {
  // at this point we should have some data (one could also listen the 'fetch' event).
  assert(db.entries);
  assert.equal(Object.keys(db.entries).length, 2);

  db.on('fetch', function(cur, prev) {
    assert.equal(Object.keys(prev).length, 2);
    assert.equal(Object.keys(cur).length, 3);
    db.stop();
  });

  // append a record
  fs.writeFileSync(tmpfile,
    fs.readFileSync(tmpfile).toString() +
    '\nkey_new,bobby,brown,13333,email3-update1,TRUE,3/21/2048 10:30:00\n');
});