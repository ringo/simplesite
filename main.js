//#!/usr/bin/env ringo
var fs = require("fs");
var system = require("system");
var config = require("./config");

var WebApp = exports.WebApp = module.resolve("./webapp");

if (require.main == module.id) {
    var {Server} = require("ringo/httpserver");
    var httpServer = new Server({
        "appName": "app",
        "appModule": WebApp,
        "port": config.get("port") || 8080
    });
    httpServer.start();
}