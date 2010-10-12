
// root directory for public content - please adapt
exports.root = "/usr/local/ringojs.org/site/";

// includes for skin rendered markdown files
exports.includes = ["navigation.txt"];

// list of directory index page names
exports.welcomePages = ["index.html", "index.md"];

// list of extensions to append to request path
exports.defaultExtensions = [".md"];

exports.urls = [
    ['/(.*)', require('./actions')],
];

exports.middleware = [
    require('ringo/middleware/gzip').middleware,
    require('ringo/middleware/etag').middleware,
    require('ringo/middleware/responselog').middleware,
    require('ringo/middleware/error').middleware,
    require('ringo/middleware/notfound').middleware
];

exports.app = require('ringo/webapp').handleRequest;

exports.macros = [
    require('ringo/skin/macros'),
    require('ringo/skin/filters'),
];

exports.charset = 'UTF-8';
exports.contentType = 'text/html';
