var fs = require('fs');
var https = require('https');
var url = require('url');
var path = require('path')

module.exports = tinyPng;

/**
 * Constructor for api interface
 *
 * @param object construtor settings
 *
 * @return object
 */
function tinyPng(settings) {
    var ENDPOINT = 'https://api.tinyPng.com/shrink';

    /**
     * Gets the API sepcific request options
     *
     * @return object
     */
    function getRequestOptions() {
        var requestOptions = url.parse(ENDPOINT);
        requestOptions.auth = 'api:' + settings.key;
        requestOptions.method = 'POST';

        return requestOptions;
    }

    /**
     * [apiSuccess description]
     *
     * @param  object res
     *
     * @return boolean
     */
    function apiSuccess(res) {
        return res.statusCode === 201;
    }

    /**
     * Gets file information from a file path and applies callback
     *
     * @param  string   file
     * @param  function callback
     *
     * @return function
     */
    function getFileInfo(file, callback) {
        return callback({
            readable: fs.createReadStream(file),
            paths: {
                input: file,
                output: file
            }
        });
    }

    /**
     * Calls the Tiny PNG API
     *
     * @param  object   fileInfo
     * @param  function callback
     *
     * @return object
     */
    function callApi(fileInfo, callback) {
        return https.request(getRequestOptions(), function(res) {
            var json = '';

            // Return an error
            if (! apiSuccess(res)) {
                return callback('An API error (' + res.statusCode + ') occured whilst processing file ' + path.basename(fileInfo.paths.input));
            }

            res.setEncoding('utf8');

            // Get JSON chunks
            res.on('data', function (chunk) {
                json += chunk;
            });

            // Resolve JSON response and process
            res.on('end', function() {
                var data = JSON.parse(json);

                data.input.filename = path.basename(fileInfo.paths.input);
                data.output.filename = path.basename(fileInfo.paths.output);

                // Get contents of file (set in response location header)
                https.get(res.headers.location, function(res) {
                    // Setup writable stream
                    var output = fs.createWriteStream(fileInfo.paths.output);

                    // Pipe file data to writable stream
                    res.pipe(output);

                    // apply callback on stream write
                    callback(null, data);
                });
            });
        });
    }

    /**
     * Grabs a file by it's path and  pipes it to the API
     *
     * @param  string   file
     * @param  function callback
     *
     * @return function
     */
    function compress(file, callback) {
        // Pipe file contents to API
        return getFileInfo(file, function(fileInfo) {
            fileInfo.readable.pipe(
                callApi(fileInfo, callback)
            );
        });
    }

    // Publicly returned API
    return {
        compress: compress
    }
}
