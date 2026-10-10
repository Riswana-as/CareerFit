const express = require("express");

let app = null;
let initError = null;

function getApp() {
  if (app) return app;
  if (initError) throw initError;
  try {
    const loaded = require("./dist/index.js");
    app = loaded.default || loaded;
    return app;
  } catch (err) {
    initError = {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    };
    console.error("[CareerFit Backend Init Error]", err);
    throw initError;
  }
}

const handler = (req, res) => {
  try {
    const expressApp = getApp();
    return expressApp(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify(
        {
          error: "STARTUP_INITIALIZATION_ERROR",
          details: err,
          cwd: process.cwd(),
          __dirname: __dirname,
          nodeVersion: process.version
        },
        null,
        2
      )
    );
  }
};

module.exports = handler;
module.exports.default = handler;
