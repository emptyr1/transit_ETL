#!/usr/bin/env node --max-old-space-size=16384 --stack-size=1000000
'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var zlib = require('zlib');
var es = require('event-stream');
var ProgressBar = require('progress');

var action = require('./' + process.argv[2]);
var files = getPaths();

if (!action.onEnd || !action.map) {
  return console.log('Action file must exports methods named: `onEnd` and `map`');
}

async.eachSeries(files, processFile, action.onEnd);


function getPaths() {
  var basePath = process.argv[3];
  var paths = [];

  var start = parseInt(process.argv[4]);
  var numDays = parseInt(process.argv[5] || '1');

  for (var i = 0; i < numDays; i++) {
    paths.push(path.join(basePath, 'sessions.log-' + (start + i) + '.gz'));
  }

  return paths;
}

function processFile(filePath, callback) {
  var fileSize = 0;

  try {
    fileSize = fs.statSync(filePath).size;
  } catch (err) {
    try {
      // Try without the .gz
      filePath = filePath.substr(0, filePath.length - 3);
      fileSize = fs.statSync(filePath).size;
    } catch (err) {
      return callback(err);
    }
  }

  var stream = fs.createReadStream(filePath)
    .pipe(newProgressBar(filePath, fileSize));

  if (filePath.substr(-3) === '.gz') {
    stream = stream.pipe(zlib.createGunzip());
  }

  stream
    .pipe(es.split())
    .pipe(es.parse())
    .pipe(es.through(function write(data) {
      var self = this;

      action.map(data, this, function (err) {
        self.emit('data', data)
      });
    },
    function end () { //optional
      this.emit('end');

      callback();
    }));
}

function newProgressBar(filePath, fileSize) {
  var options = {
    complete: '=',
    incomplete: ' ',
    width: 40,
    total: fileSize
  };

  var bar = new ProgressBar(path.basename(filePath) + ' [:bar] :percent', options);

  return es.through(function (data) {
    bar.tick(data.length);

    this.emit('data', data);
  }, function () {
    console.log('\n');

    this.emit('end');
  });
}
