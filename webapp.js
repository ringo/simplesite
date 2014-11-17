var fs = require("fs");
var strings = require("ringo/utils/strings");
var response = require("ringo/jsgi/response");
var log = require("ringo/logging").getLogger(module.id);

var {Application} = require("stick");
var {Environment} = require("reinhardt");
var markdown = require("ringo-commonmark");

// Get the config
var config = require("./config");

var templates = new Environment({
    loader: fs.resolve(config.get("configHome"), config.get("templates"))
});

var app = exports.app = new Application();
app.configure("static", require("reinhardt/middleware"), "params", "mount", module.resolve("./routing"));

if (config.get("static")) {
    var staticDir = fs.resolve(config.get("configHome"), config.get("static"))
    log.info("Mounting static dir: " + fs.absolute(staticDir));
    app.static(fs.absolute(staticDir), "index.html", "/static");
}

var contentDir = fs.resolve(config.get("configHome"), config.get("content"));
log.info("Serving content from", contentDir);

app.get(function(request, path) {
    // Check input path
    if (path !== path.replace(/\/{2,}/g, "/")) {
        return response.bad();
    }

    var mdFile;
    var filePath = fs.join(contentDir, path);
    if (!strings.endsWith(filePath, "/")) {
        // Force / at the end of URLs
        return response.redirect(path + "/");
    } else if (path === "/") {
        // Root = Render the index page
        mdFile = config.get("welcomePage") || "index.md";
    } else {
        mdFile = filePath.slice(0, -1) + ".md";
    }

    // Check if file can be rendered
    if (!fs.exists(mdFile)) {
        // Check if requested path is a directory
        if (fs.isDirectory(filePath) && fs.exists(fs.join(filePath, "index.md"))) {
            mdFile = fs.join(filePath, "index.md");
        } else {
            // 404 - File not found
            log.info("File not found: ", path, " - ", mdFile)
            return response.setStatus(404).html(templates.getTemplate("notFound.html").render({
                "path": path
            }));
        }
    }

    log.debug("File to load: " + mdFile);

    // Check if menu is present in the directory
    var menu = undefined;
    var menuFile = fs.join(fs.directory(mdFile), "__menu__.md");
    if (fs.exists(menuFile)) {
        menu = markdown.process(fs.read(menuFile, "r"));
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
        "content": htmlContent,
        "menu": menu
    }));
});
