const express = require("express");
const app = require("./dist/index.js");

module.exports = app.default || app;

