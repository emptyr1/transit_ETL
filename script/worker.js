'use strict';

var debug = require('debug')('collect:worker'),
  mysql = require('mysql'),
  async = require('async'),
  downloadJob = require('./tasks/download'),
  sessionsJob = require('./tasks/sessions'),
  placemarksJob = require('./tasks/placemarks'),
  installedAppsJob = require('./tasks/installedApps'),
  pool;

pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // TODO: Insert your MySQL password here
  database: 'transit_stats',
  connectionLimit: 50
});

module.exports = {
  saveIntoDB: saveIntoDB, 
  closePool: closePool
};

function closePool() {
  pool.end(function (err) {
    if (err) {
      debug('Error while closing the connection pool ' + err);
    }
  });
}

function saveIntoDB(job, stream, done) {
  if (job.data) {
    try {
      stream.pause();

      pool.getConnection(function (err, connection) {
        if (err) return done(err);

        stream.resume();

        saveDevice(job.data, connection, function (err) {
          if (err) {
            debug('Error processing data ' + err);
          }

          connection.release();
          done(err);
        });
      });
    } catch (err) {
      debug('Exception processing data ' + err);
      done(err);
    }
  } else {
    debug('Empty data received');
    done();
  }
}

function saveDevice(data, sql, callback) {
  var username = data.username,
    lang = data.language,
    uagent = data.userAgent;

  var content, deviceInfo = false,
    sessions = false;

  try {
    content = JSON.parse(data.content);
  } catch (err) {
    return callback(err);
  }

  if (!(content instanceof Array)) {
    deviceInfo = content.device;
    sessions = content.sessions;
  } else {
    sessions = content;
  }

  sql.query('SELECT * FROM device WHERE udid = ?', [username], function (err, result) {
    if (err) return callback(err);

    var device = createDeviceInfo(username, lang, uagent, deviceInfo, sessions, result),
      action = 'INSERT INTO',
      condition = '',
      params = [device];

    if (device.id) {
      action = 'UPDATE';
      condition = ' WHERE id = ?';

      params.push(device.id);
    }

    sql.query(action + ' device SET ?' + condition, params, function (err, result) {
      if (err) return callback(err);

      device.id = device.id || result.insertId;
      saveContent(content, deviceInfo, device, sessions, !!result.insertId, sql, callback);
    });
  });
}

function saveContent(content, deviceInfo, device, sessions, isNewDevice, sql, callback) {
  var jobs = [];

  for (var i = 0; i < sessions.length; i++) {
    if (i === 0 && isNewDevice) {
      jobs.push(downloadJob.create(sessions[i], device, sql));
    }

    jobs.push(sessionsJob.create(sessions[i], device, sql));
  }

  if (content.placemarks) {
    jobs.push(placemarksJob.create(content.placemarks, device, sql));
  }

  if ((deviceInfo && deviceInfo.installed_apps) || content.installed_apps) {
    jobs.push(installedAppsJob.create(content.installed_apps || deviceInfo.installed_apps, device, sql));
  }

  async.parallel(jobs, callback);
}

function createDeviceInfo(username, lang, uagent, deviceInfo, sessions, saved) {
  var matcher = new RegExp('^(.*?)/([0-9]+) (transitLib/(.+?) )?(.+?)/(.+?) (Device/)?(.+?)$', 'g'),
    matchs = matcher.exec(uagent),
    device = {
      udid: username
    };

  if (lang) {
    device.language = lang.substring(0, 2);
  }

  if (matchs) {
    device.app_name = matchs[1];
    device.app_version = matchs[2];
    device.type = matchs[5];
    device.os_version = matchs[6];
  }

  if (deviceInfo) {
    if (deviceInfo.push_token) {
      device.push_token = deviceInfo.push_token;
    }

    if (deviceInfo.bluetooth_enabled) {
      device.bluetooth_enabled = deviceInfo.bluetooth_enabled;
    }
  }

  if (sessions.length) {
    var index = sessions.length - 1;

    device.last_used = new Date(sessions[index].start_date);
  }

  if (!saved.length) {
    if (matchs) {
      device.model = matchs[8];
    }

    device.created_at = new Date();
  } else {
    device.id = saved[0].id;
  }

  return device;
}
