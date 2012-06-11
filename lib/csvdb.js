var https = require('https');
var csv = require('csv');
var urlparse = require('url').parse;

function csvdb(source, options, initial_fetch_callback) {
  if (typeof options === 'function') {
    initial_fetch_callback = options;
    options = {};
  }

  initial_fetch_callback = initial_fetch_callback || function() {};
  options = options || {};
  var autofetch = 'autofetch' in options ? options.autofetch : false;

  var api = new process.EventEmitter();

  api.entries = null;

  function fetch(callback) {
    callback = callback || function() { };
    var url = urlparse(source);

    var req = https.request({
      hostname: url.hostname,
      path: url.path,
      method: 'GET',
    });

    req.on('error', function(err) {
      return callback(err);
    });

    req.on('response', function(res) {

      var fields = null;
      var has_key = false;
      var entries = null;

      var e = csv().fromStream(res);
      e.on('data', function(data, index) {
        if (!fields) {
          fields = data;
          has_key = fields.filter(function(f) { return f.toLowerCase() === 'key' }).length > 0;
          entries = has_key ? {} : [];
        }
        else {
          var entry = {};
          for (var i = 0; i < fields.length; ++i) {
            var field = fields[i];
            var value = parse_value(field, data[i]);
            entry[field] = value;
          }

          if (has_key) {
            entries[entry.key] = entry;
            delete entry.key;
          }
          else {
            entries.push(entry);
          }

        }
      });

      res.on('end', function() {
        api.emit('fetch', entries, api.entries);
        api.entries = entries;
        return callback(null, entries);
      })
    });

    req.end();
  }

  function parse_value(field, val) {
    var x = val.toLowerCase();
    if (x === 'true' || x === 'yes') return true;
    if (x === 'false' || x === 'no') return false;
    var as_int = parseInt(x);
    if (as_int.toString().length === val.length) return as_int;
    if (field.indexOf('-time') !== -1) return new Date(x);
    return val;
  }

  fetch(initial_fetch_callback);

  api.fetch = fetch;

  var iv = null;

  // starts auto-fetch
  api.start = function(interval) {
    if (iv) {
      console.warn('autofetch is already started');
      return;
    }

    if (interval) {
      iv = setInterval(function() { return fetch(); }, interval);
    }
    else {
      console.warn('Cannot auto-update since `options.interval` is `false`');
    }
  };

  // stops auto-fetch
  api.stop = function() {
    if (iv) {
      clearInterval(iv);
      iv = null;
    }
  };

  // if options.interval is defined, start auto-fetch automatically
  if (autofetch) api.start(autofetch);

  return api;
}

module.exports = csvdb;