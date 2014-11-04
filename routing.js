/**
 * @fileOverview Custom routing middleware
 */

var response = require("ringo/jsgi/response");

/**
 * Middleware for HTTP method based local request routing.
 * @param {Function} next the wrapped middleware chain
 * @param {Object} app the Stick Application object
 * @returns {Function} a JSGI middleware function
 */
exports.middleware = function route(next, app) {
    var handler = function() {
        return require("ringo/jsgi/repsonse").bad();
    };

    app.get = function(newHandler) {
        handler = newHandler;
    };

    return function route(req) {
        var method = req.method;

        // Jetty strips the content for HEAD requests
        if (method === "GET" || method === "HEAD") {
            return handler.apply(null, [req, req.pathInfo]);
        }

        return response.text("Not Implemented.").setStatus(501);
    };
};