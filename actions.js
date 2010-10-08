var {Response} = require('ringo/webapp/response');
var fs = require('fs');
var md = require('ringo/markdown');
var files = require('ringo/utils/files');
var strings = require('ringo/utils/strings');
var numbers = require('ringo/utils/numbers');
var log = require('ringo/logging').getLogger(module.id);

var config = require("./config");
var root = fs.absolute(config.root);
var welcomePages = ["index.html","index.md"];

exports.index = function (req, path) {
    var uriPath = files.resolveUri(req.rootPath, path);
    var absolutePath = fs.join(root, path);

    checkRequest(uriPath);

    if (fs.isFile(absolutePath)) {
        return serveFile(absolutePath);
    }

    if (fs.isDirectory(absolutePath)) {
        for each(var name in welcomePages) {
            if (fs.isFile(fs.join(absolutePath, name))) {
                return serveFile(fs.join(absolutePath, name));
            }
        }
        if (!strings.endsWith(uriPath, "/")) {
            throw {redirect: uriPath + "/"};
        }
        return listFiles(absolutePath, uriPath);
    }
    throw {notfound:true};
};

function listFiles(absolutePath, uriPath) {
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
            lastModified: fs.lastModified(filePath),
            path: files.resolveUri(uriPath, file)
        };
    });

    var parentDir = uriPath == "/" ? "" : "/../";

    return Response.skin(module.resolve('skins/list.html'), {
        files: paths,
        title: uriPath,
        parent: parentDir
    });
}

function serveFile(file) {
    if (fs.extension(file) == ".md") {
        var context = {
            content: renderMarkdown(file)
        };
        readIncludes(config.includes, file, context);
        return Response.skin(module.resolve('skins/page.html'), context);
    }
    return Response.static(file);
}

function renderMarkdown(file) {
    return md.Markdown().process(fs.read(file));
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

