var fs = require('fs');
var https = require('https');
var url = require('url');
var path = require('path')

function TinyPng(settings) {
    var ENDPOINT = 'https://api.tinypng.com/shrink';
    var requestOptions = url.parse(ENDPOINT);

    function setupRequestOptions() {
        requestOptions.auth = 'api:' + settings.key;
        requestOptions.method = 'POST';
    }

    function success(res, callback) {
        if (res.statusCode === 201) {
            callback(res);
        }
    }

    function failure(res, callback) {
        if (res.statusCode !== 201) {
            callback(res);
        }
    }

    setupRequestOptions();

    function compress(file, callback) {

        var outputFileName = file;
        var input = fs.createReadStream(file);

        var request = https.request(requestOptions, function(res) {
            var originalRes = res,
                json = '';

            success(res, function(res){

                res.setEncoding('utf8');

                res.on('data', function (chunk) {
                    json += chunk;
                });

                res.on('end', function() {
                    var data = JSON.parse(json);

                    data.input.filename = path.basename(file);
                    data.output.filename = path.basename(outputFileName);

                    https.get(res.headers.location, function(res) {
                        var output = fs.createWriteStream(outputFileName);

                        res.pipe(output);

                        callback(null, data);
                    });
                });
            });

            failure(res, function(res) {
                callback('An API error occured (Status Code: ' + res.statusCode + ')');
            });
        });

        return input.pipe(request);
    }

    return {
        compress: compress
    }
}

module.exports = TinyPng;
