'use strict';

var util = require('../util');

exports.create = function(data, device, sql) {
  return function(done) {
    save(data, device, sql, done);
  };
};


function save(placemarks, device, sql, done) {
  var new_placemarks = [];

  if (placemarks.home) {
    var home = placemarks.home;

    home.device_id = device.id;
    home.created_at = new Date();
    home.type = 0;

    new_placemarks.push(home);
  }

  if (placemarks.work) {
    var work = placemarks.work;

    work.device_id = device.id;
    work.created_at = new Date();
    work.type = 1;

    new_placemarks.push(work);
  }

  if (new_placemarks && new_placemarks.length) {
    util.batchInsert(sql, 'placemark', new_placemarks, function(err, results) {
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
