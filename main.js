var log = require("ringo/logging").getLogger(module.id);
var engine = require("ringo/engine");
var config = require("./config");

// the HTTP server itself
const httpServer = require("httpserver");
var server = null;

const stop = exports.stop = function() {
   if (server !== null) {
      server.stop();
   }
};

const start = exports.start = function() {
   log.info("Starting application simplesite ...");
   // configure the server
   server = httpServer.build()
      // serve applications
      .serveApplication("/", module.resolve("./webapp"), {
         "virtualHosts": config.get("server:vhosts")
      })
      .http({
         "host": config.get("server:http:host"),
         "port": config.get("server:http:port")
      });

   if (config.get("server:https:port")) {
      server.https({
         "host": config.get("server:https:host"),
         "port": config.get("server:https:port"),
         "keyStore": config.get("server:https:keyStore"),
         "keyStorePassword": config.get("server:https:keyStorePassword"),
         "keyManagerPassword": config.get("server:https:keyManagerPassword"),
         "includeCipherSuites": config.get("server:https:includeCipherSuites")
      })
   }

   server.start();
};

if (require.main === module) {
   start();
}
