# csvdb

Read-only object store based on text/csv documents from the web.
Can be used, for example, to use Google Spreadsheets as a source database.

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