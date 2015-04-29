var log = require("ringo/logging").getLogger(module.id);
var engine = require("ringo/engine");
var config = require("./config");

var {Server} = require("ringo/httpserver");

var httpServer = new Server({
    "appName": "app",
    "appModule": module.resolve("./webapp"),
    "port": config.get("port") || 8080
});

/**
 * Called when the application starts
 */
var start = exports.start = function() {
    log.info("Starting simplesite application");
    httpServer.start();
    // register shutdown hook to stop ftp server
    engine.addShutdownHook(function() {
        stop();
    });
};

/**
 * Called when the engine is shut down
 */
var stop = exports.stop = function() {
    httpServer.stop();
    httpServer.destroy();
    store.connectionPool.close();
    log.info("Stopped simplesite application");
};

//Script run from command line
if (require.main === module) {
    start();
}