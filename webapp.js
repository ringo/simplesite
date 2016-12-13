var fs = require("fs");
var mime = require("ringo/mime");
var objects = require("ringo/utils/objects");
var strings = require("ringo/utils/strings");
var response = require("ringo/jsgi/response");
var fileUtils = require("ringo/utils/files");
var log = require("ringo/logging").getLogger(module.id);

var {Application} = require("stick");
var markdown = require("commonmark");

// Get the config
var config = require("./config");

const {Reinhardt} = require("reinhardt");
const reinhardt = new Reinhardt({
   loader: fs.resolve(config.get("configHome"), config.get("templates"))
});

var app = exports.app = new Application();
app.configure("static", require("reinhardt/middleware"), "params", "mount", module.resolve("./routing"));

if (config.get("static")) {
    const statics = config.get("static");

    const mountStatic = function(staticConfig) {
        const staticDir = fs.absolute(fs.resolve(config.get("configHome"), staticConfig.path));
        log.info("Mounting static directory {} to {}", staticDir, (staticConfig.baseURI || "/static"));
        app.static(
            staticDir,
            staticConfig.index || "index.html",
            staticConfig.baseURI || "/static",
            staticConfig.options || {}
        );
    };

    if (Array.isArray(statics)) {
        statics.forEach(mountStatic);
    } else {
        mountStatic(statics);
    }
}

var contentDir = fs.resolve(config.get("configHome"), config.get("content"));
log.info("Serving content from", contentDir);

app.get(function(request, path) {
    // Check input path
    if (path !== path.replace(/\/{2,}/g, "/")) {
        return response.bad();
    }

    var mdFile;
    var filePath = fs.join(contentDir, path.replace(/\//g, fileUtils.separator));
    if (mime.mimeType(path).indexOf("image/") === 0 && fs.exists(filePath)) {
        return response.static(fs.absolute(filePath), mime.mimeType(path));
    }

    if (!strings.endsWith(path, "/")) {
        // Force / at the end of URLs
        return response.redirect(path + "/");
    } else if (path === "/") {
        // Root = Render the index page
        mdFile = config.get("welcomePage") || "index.md";
    } else {
        // RingoJS 0.11 compatibility switch
        // <= 0.11 keeps the trailing slash, so we need to slice()
        if (strings.endsWith(filePath, "/")) {
            filePath = filePath.slice(0, -1);
        }
        mdFile = filePath + ".md";
    }

    // Check if file can be rendered
    if (!fs.exists(mdFile)) {
        // Check if requested path is a directory
        if (fs.isDirectory(filePath) && fs.exists(fs.join(filePath, "index.md"))) {
            mdFile = fs.join(filePath, "index.md");
        } else {
            // 404 - File not found
            log.info("File not found: ", path, " - ", mdFile)
            return response.setStatus(404).html(reinhardt.getTemplate("notFound.html").render({
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

    var template = reinhardt.getTemplate("page.html");
    return response.html(template.render(objects.merge({
        "path": path,
        "pageTitle": pageTitle,
        "content": htmlContent,
        "menu": menu
    }, (config.get("defaultContext") || {}))));
});
