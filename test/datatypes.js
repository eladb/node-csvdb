var fs = require('fs');
var path = require('path');
var assert = require('assert');
var csvdb = require('..');

var tmpfile = '/tmp/csvdb-test.csv';

fs.writeFileSync(tmpfile, fs.readFileSync(path.join(__dirname, 'test.csv')));

var db = csvdb(tmpfile, {
    autofetch: 1000
});

db.once('fetch', function() {

    assert.equal(Object.keys(db.entries).length, 2);

    var row = db.entries["key3"];

    assert.equal(typeof row.enabled, "boolean");
    assert.equal(typeof row["update-time"], "object");
    assert.equal(typeof row.first, "string");
    assert.equal(typeof row.phone, "number");

    db.stop();
});