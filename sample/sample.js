var source = 'https://docs.google.com/spreadsheet/pub?key=0AuP9sJn-WbrXdFJzTUN0RXdvUXg2YlVuMnBJRFozTmc&single=true&gid=0&output=csv';
var csvdb = require('..');

csvdb(source, function(err, entries) {
  console.log(entries)
});
