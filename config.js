
// root directory for public content - please adapt
exports.root = "site";

// includes for skin rendered markdown files
exports.includes = ["navigation.txt"];

// list of directory index page names
exports.welcomePages = ["index.html", "index.md"];

// list of extensions to append to request path
exports.defaultExtensions = [".md"];

exports.sitemap = {
    "/": "Home",
    "/getting_started": "Getting Started",
    "/downloads": "Downloads",
    "/documentation": "Documentation",
    "/screencasts": "Screencasts",
    "/contributing": "Contributing",
    "/code": "Code"
}

exports.app = require("./actions").index;
