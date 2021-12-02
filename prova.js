"use strict";
exports.__esModule = true;
var rra = require("./lib/cjs/index");
rra.list('./test').then(function (data) {
    console.log(data);
});
