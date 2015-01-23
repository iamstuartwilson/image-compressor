#!/usr/bin/env node

var argv = require('minimist')(process.argv);
var chalk = require('chalk');
var imogen = require('../');
var args = getArgs();

// Pulls out arguments
function getArgs() {

    if (! argv.d || ! argv.k) {
        return false;
    }

    return {
        dir: argv.d,
        key: argv.k
    }
}

// Run from command line
if (args) {
    imogen(args.dir, args.key)
    .on('file', function(data) {
        console.log(
            'Source: %s (%s) reduced by %s% (%s)',
            chalk.magenta(data.input.name),
            data.input.size + data.input.unit,
            data.compression.percent,
            chalk.green(data.output.size + data.output.unit)
        );
    }).on('done', function(data) {
        console.log(
            'Completed in %s saving: %s',
            data.time.duration + ' ' + data.time.unit,
            chalk.green(data.saving.size + data.saving.unit)
        );
    }).on('error', function(error) {
        console.error(chalk.red(error));
    });
} else {
    console.error('No directory or key set');
}
