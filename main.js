//#!/usr/bin/env ringo
var system = require("system");
var fs = require("fs");
var {Parser} = require("ringo/args");

var WebApp = exports.WebApp = module.resolve("./webapp");

var config = {};

var loadConfig = exports.loadConfig = function(path) {
    config = JSON.parse(fs.read(path));
}

var getConfig = exports.getConfig = function() {
    return config;
}

function main(args) {
    var parser = new Parser();
    parser.addOption("c", "config", "config", "Path to the configuration file");
    var opts = parser.parse(args);

    var configFile = opts.config;
    if (!configFile || !fs.exists(configFile)) {
        configFile = module.resolve("./config/defaultConfig.json");
    }

    if (!fs.exists(configFile)) {
        console.err("Missing config file", configFile);
        system.exit(1);
    }

    try {
        loadConfig(configFile);
        if (!config.contentDirectory || !fs.exists(config.contentDirectory)) {
            console.err("Invalid content directory in config: " + config.contentDirectory);
            system.exit(1);
        }

        if (!config.templateDirectory || !fs.exists(config.templateDirectory)) {
            console.err("Invalid template directory in config: " + config.templateDirectory);
            system.exit(1);
        }
    } catch (e) {
        console.log("Error parsing config file '", configFile, "': ", e);
        system.exit(1);
    }
    var loggingConfig = getResource((config.logging ? config.logging : module.resolve("./config/log4j.properties")));
    require("ringo/logging").setConfig(loggingConfig, true);

    // main script to start application
    if (require.main == module) {
        var {Server} = require("ringo/httpserver");
        var httpServer = new Server({
            "appName": "app",
            "appModule": WebApp,
            "port": config.port || 8080
        });
        httpServer.start();
    }
}

if (require.main == module.id) {
    main(system.args.slice(1));
}