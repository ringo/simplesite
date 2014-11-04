# simplesite - a markdown-based website publisher

This is a simple web app for publishing static websites with RingoJS.
It only serves markdown files and nothing else.

Start the application with

    ringo main.js

Then point your browser to this URL:

    http://localhost:8080/

The default configuration will serve this application's "content" directory with
its default templates.

To serve files from a different directory use the `--config` option, for example:

    ringo main.js --config /path/to/config/cfg.json

# Custom templates and configuration

A custom content directory can be specified in the configuration. The template
directory is also configured in the configuration file. This is a different
behaviour than in older versions of simplesite.