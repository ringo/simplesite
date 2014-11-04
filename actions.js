var fs = require("fs");
var config = require("./main").config;
var strings = require("ringo/utils/strings");
var response = require("ringo/jsgi/response");
var log = require("ringo/logging").getLogger(module.id);

var {Application} = require("stick");
var {Environment} = require("reinhardt");
var markdown = require("ringo-commonmark");

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

    var mdFile = fs.join(config.contentDirectory, path);
    if (strings.endsWith(mdFile, "/")) {
        mdFile += "index.md";
    } else {
        mdFile += ".md";
    }
    log.info("File to load: " + mdFile);

    if (!fs.exists(mdFile)) {
        log.info("file not found: ", path, " - ", mdFile)
        var notFound = templates.getTemplate("notFound.html");
        return response.html(notFound.render({
            "path": path
        }));
    }

    var htmlContent = markdown.process(fs.read(mdFile, "r"));

    // Extract title
    var pageTitle;
    if (strings.startsWith(htmlContent, "<h1>")) {
        pageTitle = htmlContent.substring(4, htmlContent.indexOf("</h1>"));
    }

    var template = templates.getTemplate("page.html");
    return response.html(template.render({
        "path": path,
        "pageTitle": pageTitle,
        "content": htmlContent
    }));
});
