var fs = require('fs');
var findit = require('findit');
var path = require('path');
var chalk = require('chalk');

var TinyPng = require('./lib/tiny-png');

var args = getArgs()

// Run from command line
if (args) {
    walkDir(args.dir, args.key);
}

function getArgs() {
    var dir = process.argv[2];
    var apiKey = process.argv[3];

    if (! dir) {
        return false;
    }

    return {
        dir: dir,
        key: apiKey
    }
}

function isValidFile(file) {
    return ['.png', '.jpg'].indexOf(path.extname(file)) > -1;
}

function walkDir(dir, apiKey) {
    var api = new TinyPng({
        key: apiKey
    });

    var finder = findit(dir);

    if(! dir) {
        throw 'No directory set';
    }

    if (! apiKey) {
        throw 'No API key set';
    }

    finder.on('file', function(file, stat) {
        if (file && isValidFile(file)) {
            api.compress(file, function(err, data) {
                if (err) {
                    return console.error(err);
                }

                console.log(
                    'Source: %s (%s) reduced by %s% (%s)',
                    chalk.magenta(data.input.filename),
                    Math.round(data.input.size / 1000) + 'kb',
                    Math.round((1 - data.output.ratio) * 100),
                    chalk.green(Math.round(data.output.size / 1000) + 'kb')
                );
            });
        }
    });

}

module.exports = walkDir;
