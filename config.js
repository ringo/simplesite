var fs = require("fs");
var system = require("system");
var log = require("ringo/logging").getLogger(module.id);

// Load the default configuration
var config = require("gestalt").load(module.resolve("./config/config.json"));

// Parse command line arguments
var {Parser} = require("ringo/args");
var parser = new Parser();
parser.addOption("c", "config", "config", "Path to a custom configuration directory");
var opts = parser.parse(system.args.slice(1));

// look for environment variable
var envConfig = system.env["SIMPLESITE_CONFIG"];

// Load the config file
var configHome = fs.resolve(envConfig || opts.config || module.directory);
log.info("Config home: " + configHome);

if (envConfig || opts.config) {
    var customConfigFile = fs.join(configHome, "config.json");
    if (fs.exists(customConfigFile)) {
        log.info("Loading config:", customConfigFile);
        config.merge(customConfigFile);
    } else {
        log.error("Config file does not exist!", customConfigFile);
    }
}

var logConfig = fs.join(configHome, "log4j.properties");
if (!fs.exists(logConfig)) {
    logConfig = module.resolve("./config/log4j.properties");
}
log.info("Logging config: " + fs.absolute(logConfig));

config.set("configHome", configHome);
config.set("logging", getResource(fs.absolute(logConfig)));

// Set the logging config
require("ringo/logging").setConfig(config.get("logging"), true);

module.exports = config;