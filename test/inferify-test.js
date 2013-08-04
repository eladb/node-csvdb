var fs = require('fs');
var path = require('path');
var assert = require('assert');
var csvdb = require('..');

var tmpfile = '/tmp/largedataset.csv';
var now = new Date().getTime();

fs.writeFileSync(tmpfile, fs.readFileSync(path.join(__dirname, 'largedataset.csv')));

var db = csvdb(tmpfile);

db.once('fetch', function() {

    assert(db.entries);
    assert.equal(Object.keys(db.entries).length, 1999); //make sure all data is loaded

    //Check data types for a random row
    console.log("Total processing time: %dms", (new Date().getTime()-now));

    var row = db.entries["key2293"];
    assert.equal(typeof row.boolean, "boolean");
    assert.equal(typeof row.string_with_booleans, "string");
    assert.equal(typeof row.integers, "number");
    assert.equal(typeof row.float, "number");
    assert.equal(typeof row.dates, "object");

    db.stop();


});