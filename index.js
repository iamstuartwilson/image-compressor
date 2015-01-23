/**
 * To do:
 * --------------
 *
 * Modularise:
 *     - Break down into single file validator and api call
 *     - Use index.js for binding
 *     - Add support for CLI
 *
 * Rename to imogen namespace
 *
 * Write tests
 */

var fs = require('fs');
var findit = require('findit');
var path = require('path');
var events = require('events');

var TinyPng = require('./lib/tiny-png');

// Checks that the file is a .png or .jpg
function isValidFile(file) {
    return ['.png', '.jpg'].indexOf(path.extname(file)) > -1;
}

// Walks a directory and compresses images
function walkDir(dir, apiKey) {

    // Setup api client
    var api = new TinyPng({
        key: apiKey
    });

    // Time object for duration based calculations
    var time = {
        start: new Date(),
        end: new Date(),
        duration: function() {
            return this.end.getTime() - this.start.getTime();
        },
        format: function(time) {
            return Math.round(time / 1000);
        }
    };

    // Event emitter to return
    var event = new events.EventEmitter();

    // Directory walker
    var finder = findit(dir);

    // Basic file compression count
    var totalSaving = validFileCount = compressedFileCount = foundFileCount = 0;

    // Check for parameters
    if(! dir) {
        throw 'No directory set';
    }

    if (! apiKey) {
        throw 'No API key set';
    }

    // Walk direcory and trigger event on find
    finder.on('file', function(file, stat) {
        if (file && isValidFile(file)) {
            foundFileCount ++;

            api.compress(file, function(err, data) {

                if (err) {
                    validFileCount --;
                    return event.emit('error', err);
                }

                event.emit('file', {
                    input: {
                        name: data.input.filename,
                        size: Math.round(data.input.size / 1000),
                        unit: 'kb'
                    },
                    output: {
                        name: data.output.filename,
                        size: Math.round(data.output.size / 1000),
                        unit: 'kb'
                    },
                    compression: {
                        ratio: data.output.ratio,
                        percent: Math.round((1 - data.output.ratio) * 100)
                    }
                });

                compressedFileCount ++;
                totalSaving += data.input.size - data.output.size;

                if (validFileCount === compressedFileCount) {
                    time.end = new Date();

                    event.emit('done', {
                        saving: {
                            size: Math.round(totalSaving / 1000),
                            unit: 'kb'
                        },
                        time: {
                            start: time.format(time.start.getTime()),
                            end: time.format(time.end.getTime()),
                            duration: time.format(time.duration()),
                            unit: 'seconds'
                        }
                    });
                }

            });

            validFileCount ++;
        }
    });

    finder.on('end', function() {
        event.emit('found', {
            fileCount: foundFileCount
        });
    });

    return event;

}

module.exports = walkDir;
