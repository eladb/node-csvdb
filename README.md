# csvdb

[![Build Status](https://secure.travis-ci.org/eladb/node-csvdb.png?branch=master)](http://travis-ci.org/eladb/node-csvdb)

Read-only object store for small scale datasets based on text/csv documents from the web.
Can be used, for example, to use Google Spreadsheets as a simple data source for small (I would say up too 500 entries) datasets.

[__Stability__](http://nodejs.org/docs/latest/api/all.html#all_stability_index): 3 - Stable

csvdb sends an HTTP GET to the specified URL and parses the resulting csv as if each row is an object. The header line is used to name the object's
fields. If a `key` column is provided, csvdb will return a hash (keyed by the value in the `key` column). If not, it will just return an array.

There is naive type inference (strings, numbers and time).

TODO:
 - Paging
 - ?

For example, the following data source is based on a published Google Spreadsheets document:

```bash
$ curl -i 'https://docs.google.com/spreadsheet/pub?key=0AuP9sJn-WbrXdFJzTUN0RXdvUXg2YlVuMnBJRFozTmc&output=csv'
HTTP/1.1 200 OK
Content-Type: text/csv; charset=UTF-8
X-Robots-Tag: noindex, nofollow, nosnippet
Content-Disposition: attachment; filename="csvdb-test.csv"
Date: Wed, 13 Jun 2012 22:34:23 GMT
Expires: Wed, 13 Jun 2012 22:34:23 GMT
Cache-Control: private, max-age=0
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Server: GSE
Transfer-Encoding: chunked

key,first,last,phone,email,enabled,update-time
key1,elad,benisrael,387383833,elad.benisrael@gmail.com,TRUE,12/3/2011
key2,first2,last2-changed,654321,email2,TRUE,1/28/1980
key3,first3,another last,phone3,email3-update1,FALSE,3/23/2011 23:30:00eladb@eladb-2:~ $ 
```

This is how csvdb sees it:

```javascript
$ node
> var csvdb = require('csvdb')
> var db = csvdb('https://docs.google.com/spreadsheet/pub?key=0AuP9sJn-WbrXdFJzTUN0RXdvUXg2YlVuMnBJRFozTmc&output=csv', { autofetch: 5000 })
> db.entries
{ key1: 
   { first: 'elad',
     last: 'benisrael',
     phone: 387383833,
     email: 'elad.benisrael@gmail.com',
     enabled: true,
     'update-time': Fri, 02 Dec 2011 22:00:00 GMT },
  key2: 
   { first: 'first2',
     last: 'last2-changed',
     phone: 654321,
     email: 'email2',
     enabled: true,
     'update-time': Sun, 27 Jan 1980 22:00:00 GMT },
  key3: 
   { first: 'first3',
     last: 'another last',
     phone: 'phone3',
     email: 'email3-update1',
     enabled: false,
     'update-time': Wed, 23 Mar 2011 21:30:00 GMT } }
> 
```

Since `{ autofetch: 5000 }` is provided, `db.entries` will be refreshed every 5 seconds, so if one changes the data 
source (in this case, just edits the spreadsheet), it will be quickly reflected in `db.entries`.

See a few more examples below.

## API

```js
var db = csvdb(url, [options], [callback]);
```

Fetches a csv from the provided URL and calls the callback (`function(err, entries)`) with the initial resultset (if provided).

`options.autofetch` may contain an interval (in milliseconds) which will periodically update the resultset.

`db.entries` will contain the last resultset. If `autofetch` is started, it will be updated periodically under the hood.

`db.start(interval)` will start the periodic auto-fetch update.

`db.stop()` will stop the periodic auto-fetch update.

`db.on('fetch', function(curr, prev) {...})` will be emitted after every fetch with the current (`curr`) and previous (`prev`) resultsets.

## Examples

### Single fetch

This will fetch the CSV from `url` and return the resultset in `entries` (or an error).

```js
csvdb(url, function(err, entries) {
  console.log(entries);
});
```

### Auto-fetch

This will open the database an will initiate an update every 5 seconds.
The `fetch` event is emitted on every fetch with the current and previous resultset.

```js
var db = csvdb(url, { autofetch: 5000 });
db.on('fetch', function() {
  console.log('current resultset:\n', db.entries);
});
```

### Behind-the-scenes update

`db.entries` can be used to access the last resultset at any given moment. Please make sure to prepare for a `null` if there is no data yet.

```js
var db = csvdb(url, { autofetch: 5000 });

setInterval(function() {
  if (!db.entries) console.log('no data yet');
  else console.log(db.entries);
}, 5000);
```

## Types

csvdb has some type inference logic:

 * If there is a column named `key`, the resultset will be a hash keyed by `key`. Note that duplicate keys _will_ override.
 * If the column name has the string `-time` in it, it will be `Date.parse`d.
 * If the value can be parsed as an integer, it will be.

## The MIT License

Copyright (C) 2012 Elad Ben-Israel

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
