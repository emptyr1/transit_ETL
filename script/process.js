'use strict';

var worker = require('./worker');

exports.onEnd = function (err) {
  worker.closePool();
};

exports.map = function (data, stream, cb) {
  worker.saveIntoDB({ data: data }, stream, cb);
};
