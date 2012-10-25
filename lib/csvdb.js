var https = require('https');
var fs = require('fs');
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
    callback = callback || function(err) {
      if (err) console.error('ERROR (csvdb):', err);
    };

    var url = urlparse(source);

    // if the url is a file path (or file:// url), read it from disk.
    if (!url.protocol || url.protocol === 'file:') {
      var filepath = !url.protocol ? source : url.path;
      var input = fs.createReadStream(filepath);
      return update_entries(input, callback);
    }
    else {
      var req = https.request(url);
      req.on('error', function(err) { return callback(err); });
      req.on('response', function(res) { return update_entries(res, callback); });
      req.end();
    }
  }

  function update_entries(input_stream, callback) {
    callback = callback || function() { };
    var s = create_stream(input_stream);

    var entries = null;

    s.on('data', function(entry) {
      // if this is the first entry, determine if `entries` is going
      // to be a hash (if entry has attribute `key` or an array).
      if (!entries) {
        if (entry.key) entries = {};
        else entries = [];
      }

      if (typeof entries === 'object') {
        if (!entry.key) {
          console.error('ERROR: all entries must have a `key` attribute:', JSON.stringify(entry));
        }
        else {
          entries[entry.key] = entry;
        }
      }
      else { 
        // entries is an array (no `key` attribute for first entry)
        entries.push(entry);
      }
    });

    s.on('end', function() {
      var prev = api.entries;
      api.entries = entries;
      api.emit('fetch', entries, prev);
      return callback(null, entries);
    });
  }

  function create_stream(input_stream) {
    var stream = new process.EventEmitter();

    var csvinput = csv().fromStream(input_stream);

    var fields = null;

    csvinput.on('data', function(data, index) {
      if (!fields) {
        fields = data;
      }
      else {
        var entry = {};
        for (var i = 0; i < fields.length; ++i) {
          var field = fields[i];
          var value = parse_value(field, data[i]);
          entry[field] = value;
        }

        stream.emit('data', entry);
      }
    });

    csvinput.on('end', function() {
      stream.emit('end');
    });

    return stream;
  }

  function parse_value(field, val) {
    val = val || '';
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