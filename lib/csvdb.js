var https = require('https');
var fs = require('fs');
var csv = require('csv');
var urlparse = require('url').parse;
var type_conversion = require('./type-conversion.js');
var inferify = require('inferify');

function csvdb(source, options, initial_fetch_callback) {
  if (typeof options === 'function') {
    initial_fetch_callback = options;
    options = {};
  }

  initial_fetch_callback = initial_fetch_callback || function() {};
  options = options || {};
  var autofetch = 'autofetch' in options ? options.autofetch : false;
  var encoding = options.encoding || 'utf8';

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
      req.on('response', function(res) {
        res.setEncoding(encoding);
        return update_entries(res, callback);
      });
      req.end();
    }
  }

  function update_entries(input_stream, callback) {
    callback = callback || function() { };
    var s = create_stream(input_stream);

    var entries = [];

    s.on('record', function(entry) {
      entries.push(entry);
    });

    s.on('end', function() {
      var prev = api.entries;
      var parsed_entries = (entries.length > 10)  ? parse_content_complex(entries) : parse_content(entries);
      api.entries = parsed_entries;
      api.emit('fetch', parsed_entries, prev);
      return callback(null, parsed_entries);
    });
  }

  function create_stream(input_stream) {
    return csv().from.stream(input_stream);
  }

  function parse_value(field, val) {
    val = val || '';
    var x = val.toLowerCase();
    if (x === 'true' || x === 'yes') return true;
    if (x === 'false' || x === 'no') return false;
    var as_int = parseInt(x, 10);
    if (as_int.toString().length === val.length && !isNaN(as_int)) return as_int;
    if (field.indexOf('-time') !== -1) return new Date(x);
    return val;
  }

  function parse_content(dataset) {
    var hash_result = {};
    var array_result = [];
    var has_key = false;

    var fields = null;
    var len = dataset.length;
    fields = dataset[0];
    for (var t = 1; t < len; t++) {
        var row = dataset[t];
        var entry = {};
        for (var i = 0; i < fields.length; ++i) {
            var field = fields[i];
            var value = parse_value(field, row[i]);
            entry[field] = value;
        }
        if (!entry.key) {
          array_result.push(entry);
        }
        else {
          has_key = true;
          hash_result[entry.key] = entry;
        }
    }

    if (has_key) {
      array_result.forEach(function(r) {
        console.log('WARNING: no `key` for entry', r);
      });

      return hash_result;
    }
    else {
      return array_result; // no key at all
    }
  }

  function parse_content_complex(dataset) {
    var hash_result = {};
    var array_result = [];
    var has_key = false;

    var fields = null;
    var len = dataset.length;

    // create a set of convertor method out of a sample of 10 fields from the dataset
    fields = dataset[0];
    var convertors =  [];
    var inferArr = [];
    for (var i = 0; i < fields.length; ++i) {
      inferArr[i] = [];
      for (var t = 1; t < 10; t++) {
        inferArr[i].push(dataset[t][i]);
      }
      var type = inferify(inferArr[i]);
      convertors[i] = type_conversion['parse_'+type];
    }
    // with convertor methods at hand, convert the full dataset 
    for (var t = 1; t < len; t++) {
      var row = dataset[t];
      var entry = {};
      for (var i = 0; i < fields.length; ++i) {
        var value = convertors[i](row[i]);
        entry[fields[i]] = value;
      }

      if (entry.key) {
        has_key = true;
        hash_result[entry.key] = entry;
      }
      else {
        array_result.push(entry);
      }
    }

    if (has_key) {
      array_result.forEach(function(r) {
        console.log('WARNING: no `key` for entry', r);
      });

      return hash_result;
    }
    else {
      return array_result; // no key at all
    }    
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