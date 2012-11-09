//a simple parser for when datatype is known
var field_parser = {
    parse_boolean: function(y) {
        if (typeof y != "string") return "";
        var x = y.toString().toLowerCase();
        if (x === 'true' || x === 'yes') return true;
        if (x === 'false' || x === 'no') return false;
    },
    parse_string: function(x) {
        return "" || x;
    },
    parse_integer: function(x) {
        return parseInt(x, 10);
    },
    parse_float: function(x) {
        return parseFloat(x);
    },
    parse_number: function(x) {
        return parseFloat(x);
    },
    parse_date: function(x) {
        return new Date(x);
    }
};

module.exports = field_parser;