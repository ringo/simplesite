var fs = require("fs");
var config = require("./main").config;
var response = require("ringo/jsgi/response");
var log = require("ringo/logging").getLogger(module.id);

var {Application} = require("stick");
var {Environment} = require("reinhardt");

var templates = new Environment({
    loader: config.templates || module.resolve("./templates")
});

var app = exports.app = new Application();
app.configure("static", require("reinhardt/middleware"), "params", "mount", module.resolve("./routing"));

if (config.static) {
    log.info("Mounting static dir: " + fs.absolute(config.static));
    app.static(fs.absolute(config.static), "index.html", "/static");
}

app.get(function(request, path) {
    // Check input path
    if (path !== path.replace(/\/\/+/g, "\/")) {
        return response.bad();
    }

    var template = templates.getTemplate("base.html");
    return response.html(template.render({
        "path": path
    }));
});
