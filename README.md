This is a simple web app for publishing static websites with RingoJS.
Most files are served as-is except for Markdown files (.md) which are converted
to HTML on the fly.

Start the application with

   ringo main.js

Then point your browser to this URL:

   http://localhost:8080/

The default configuration will serve this application's "content" directory with
its default templates.

To serve files from a different directory use the `--contentdir` option, for example:

   ringo main.js --contentdir /my/content/to/serve/

Custom templates and configuration
------------------------------------

A custom home directory can be specified with the `--homedir` option. Within
this home directory you can override the templates, the `config.json` and provide
the content to be served. A Simplesite home directory can contain the following:

   * "content" directory, which holds the content to serve
   * (optional) "templates" directory to override the default templates
   * (optional) "config.json" simplesite ships with an example config.json

To serve with a custom home directory, start simplesite with the `--homedir` option:

    ringo main.js --homedir ~/my-simplesite-instance/