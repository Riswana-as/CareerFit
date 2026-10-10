const express = require("express");
const rawApp = require("./dist/index.js");
const app = rawApp.default || rawApp;

module.exports = app;
module.exports.default = app;
