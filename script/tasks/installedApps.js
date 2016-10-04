'use strict';

var util = require('../util');

exports.create = function (data, device, sql) {
  return function (done) {
    save(data, device, sql, done);
  };
};


function save(apps, device, sql, done) {
  var data = [],
    keys = Object.keys(apps),
    fromArray = apps instanceof Array;

  for (var key in keys) {
    data.push({
      device_id: device.id,
      name: fromArray ? apps[key] : keys[key],
      installed: fromArray ? true : !!apps[keys[key]]
    });
  }

  if (data && data.length) {
    util.batchInsert(sql, 'installed_app', data, function (err, results) {
      if (err && err.code != 'ER_DUP_ENTRY') {
        done(err);
      } else {
        done();
      }
    }, true);
  } else {
    done();
  }
}
