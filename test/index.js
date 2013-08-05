var path = require('path');
var fs = require('fs');
function requireFile(file) {
  if (path.extname(file) === '.js'){
    console.log("Tests for: \033[34mm%s\033[0m",  file);
    require("./" + file.replace('.js', ''));
  }
}

fs.readdirSync("./test/").forEach(requireFile);