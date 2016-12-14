const log = require("ringo/logging").getLogger(module.id);
const engine = require("ringo/engine");
const config = require("./config");

// the HTTP server itself
const httpServer = require("httpserver");
let server = null;

const stop = exports.stop = function() {
   if (server !== null) {
      server.stop();
   }
};

const init = exports.init = function() {
   log.info("Configuring the httpserver ...");
   // configure the server
   server = httpServer.build()
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

   log.info("Starting application simplesite ...");
   server.start();
};

if (require.main === module) {
   init();
}
