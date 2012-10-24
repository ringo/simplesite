//#!/usr/bin/env ringo
var system = require('system');
var fs = require('fs');
var {Parser} = require("ringo/args");
var parser = new Parser();
parser.addOption("h", "homedir", "homedir", "Path to home directory");
parser.addOption("c", "contentdir", "contentdir", "Path to content directory");
var opts = parser.parse(system.args.slice(1));

if (opts.homedir && opts.contentdir) {
    console.log('You can not provide both, a homedir and a contentdir.');
    system.exit(1);
}

var homeDir = fs.resolve(opts.homedir || module.directory);
var configFile = fs.resolve(homeDir, "./config.json");
if (!fs.exists(configFile)) {
   configFile = module.resolve("./config.json");
}
if (!fs.exists(configFile)) {
   console.log('Missing config file', configFile);
   system.exit(1);
}
try {
   exports.config = JSON.parse(fs.read(configFile));
   exports.config.root = fs.join(homeDir, 'content');
   if (opts.contentdir) {
    exports.config.root = opts.contentdir;
   }
} catch (e) {
   console.log('Error parsing config file "', configFile ,'": ', e);
   system.exit(1);
}

exports.app = require("./actions").index;

// main script to start application
if (require.main == module) {
    var {Server} = require("ringo/httpserver");
    var httpServer = new Server({
        "appName": "app",
        "appModule": module.resolve('./main'),
        "port": exports.config.port || 8080
    });
    httpServer.start();
}
