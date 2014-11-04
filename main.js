//#!/usr/bin/env ringo
var system = require("system");
var fs = require("fs");
var {Parser} = require("ringo/args");

var parser = new Parser();
parser.addOption("c", "config", "config", "Path to the configuration file");
var opts = parser.parse(system.args.slice(1));

var configFile = opts.config;
if (!configFile || !fs.exists(configFile)) {
    configFile = module.resolve("./config/defaultConfig.json");
}

if (!fs.exists(configFile)) {
    console.err("Missing config file", configFile);
    system.exit(1);
}

var config;
try {
    config = exports.config = JSON.parse(fs.read(configFile));
    if (!config.contentDirectory || !fs.exists(config.contentDirectory)) {
        console.err("Invalid content directory in config: " + config.contentDirectory);
        system.exit(1);
    }
} catch (e) {
    console.log("Error parsing config file '", configFile ,"': ", e);
    system.exit(1);
}
var loggingConfig = getResource((config.logging ? config.logging : module.resolve("./config/log4j.properties")));
require("ringo/logging").setConfig(loggingConfig, true);

// main script to start application
if (require.main == module) {
    var {Server} = require("ringo/httpserver");
    var httpServer = new Server({
        "appName": "app",
        "appModule": module.resolve("./actions"),
        "port": config.port || 8080
    });
    httpServer.start();
}
