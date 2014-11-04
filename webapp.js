var fs = require("fs");
var strings = require("ringo/utils/strings");
var response = require("ringo/jsgi/response");
var log = require("ringo/logging").getLogger(module.id);

var {Application} = require("stick");
var {Environment} = require("reinhardt");
var markdown = require("ringo-commonmark");

// Get the config
var config = require("./main").getConfig();

var templates = new Environment({
    loader: config.templateDirectory
});

var app = exports.app = new Application();
app.configure("static", require("reinhardt/middleware"), "params", "mount", module.resolve("./routing"));

if (config.static) {
    log.info("Mounting static dir: " + fs.absolute(config.static));
    app.static(fs.absolute(config.static), "index.html", "/static");
}

app.get(function(request, path) {
    // Check input path
    if (path !== path.replace(/\/{2,}/g, "/")) {
        return response.bad();
    }

    var mdFile = fs.join(config.contentDirectory, path);
    if (!strings.endsWith(mdFile, "/")) {
        // Force / at the end of URLs
        return response.redirect(path + "/");
    } else if (path === "/") {
        // Root = Render the index page
        mdFile += config.welcomePage || "index.md";
    } else {
        mdFile = mdFile.slice(0, -1) + ".md";
    }

    log.debug("File to load: " + mdFile);

    if (!fs.exists(mdFile)) {
        log.info("File not found: ", path, " - ", mdFile)
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
