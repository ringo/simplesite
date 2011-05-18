var response = require('ringo/jsgi/response');
var fs = require('fs');
var md = require('ringo/markdown');
var files = require('ringo/utils/files');
var strings = require('ringo/utils/strings');
var numbers = require('ringo/utils/numbers');
var dates = require('ringo/utils/dates');
var log = require('ringo/logging').getLogger(module.id);
var mustache = require('ringo/mustache');

var config = require("./config");
var root = fs.canonical(config.root);
var {welcomePages, defaultExtensions, sitemap} = config;

exports.index = function (req) {
    var path = req.pathInfo;
    var uriPath = files.resolveUri(req.rootPath, path);

    // better be safe - make sure path is contained in root
    var absolutePath = fs.canonical(fs.join(root, path));
    if (absolutePath.indexOf(root) != 0) {
        throw {notfound:true};
    }

    checkRequest(uriPath);

    if (fs.isFile(absolutePath)) {
        return serveFile(absolutePath, uriPath);
    }

    var masterTemplate = req.env.masterTemplate || "templates/master";

    if (fs.isDirectory(absolutePath)) {
        if (!strings.endsWith(uriPath, "/")) {
            return response.redirect(uriPath + "/");
        }
        for each(var name in welcomePages) {
            var file = fs.join(absolutePath, name);
            if (fs.isFile(file)) {
                return serveFile(file, uriPath, masterTemplate);
            }
        }
        return listFiles(absolutePath, uriPath, masterTemplate);
    }
    if (!fs.extension(uriPath) && Array.isArray(defaultExtensions)) {
        for each (var ext in defaultExtensions) {
            if (fs.isFile(absolutePath + ext)) {
                return serveFile(absolutePath + ext, uriPath, masterTemplate);
            }
        }
    }
    return response.notFound(req.pathInfo);
};

function listFiles(absolutePath, uriPath, masterTemplate) {
    var paths = fs.list(absolutePath).filter(function(file) {
        return !files.isHidden(file);
    }).sort().map(function(file) {
        var filePath = fs.join(absolutePath, file);
        var size;
        if (fs.isDirectory(filePath)) {
            size = fs.list(filePath).length + " files";
        } else {
            size = numbers.format(fs.size(filePath) / 1024) + " kB";
        }
        return {
            name:file,
            size: size,
            lastModified: dates.format(fs.lastModified(filePath), "yyyy-MM-dd HH:mm"),
            path: files.resolveUri(uriPath, file)
        };
    });

    var parentDir = uriPath == "/" ? "" : "/../";

    return responseHelper('templates/list.html', masterTemplate, {
        files: paths,
        title: uriPath,
        parent: parentDir
    });
}

function serveFile(file, uri, masterTemplate) {
    if (fs.extension(file) == ".md") {
        var context = {
            content: renderMarkdown(file)
        };
        if (sitemap && uri in sitemap) {
            context.title = sitemap[uri];
        }
        readIncludes(config.includes, file, context);
        return responseHelper('templates/page.html', masterTemplate, context);
    }
    return response.static(file);
}

function renderMarkdown(file) {
    return md.Markdown({
        getLink: function(id) {
            var link = this.super$getLink(id);
            return link || ["/wiki/" + id.replace(/\s/g, "_"), "wiki link"];
        }
    }).process(fs.read(file));
}

function readIncludes(includes, file, context) {
    for each (var inc in includes) {
        var include = fs.resolve(file, inc);
        if (fs.isFile(include)) {
            var ext = fs.extension(include);
            context[fs.base(include, ext)] = (ext == ".md") ?
                    renderMarkdown(include) : fs.read(include);
        }
    }
}

function checkRequest(request) {
    var path = request.split('/');

    for (var i = 0; i < path.length; i++) {
        if (path[i] != "" && files.isHidden(path[i])) {
            throw {notfound:true};
        }
    }
}

function responseHelper(template, masterTemplate, context) {
    var tmp = getResource(module.resolve(template));
    context.content = mustache.to_html(tmp.content, context);
    if (fs.isRelative(masterTemplate)) {
        masterTemplate = module.resolve(masterTemplate)
    }
    var master = getResource(masterTemplate);
    return response.html(mustache.to_html(master.content, context));
}
