'use strict';

var util = require('../util'),
  async = require('async');

exports.create = function (data, device, sql) {
  return function (done) {
    save(data, device, sql, done);
  };
};


function save(json, device, sql, done) {
  var jsonView, feeds = [],
    feedsInfo = [];

  if (!json.nearby_views) {
    done();
    return;
  }

  for (var i = 0; i < json.nearby_views.length; i++) {
    jsonView = json.nearby_views[i];

    if (feeds.indexOf(jsonView.feed_id) == -1) {
      feeds.push(jsonView.feed_id);
      feedsInfo.push({
        feed_id: jsonView.feed_id || -1,
        date: new Date(json.start_date),
        download: 1
      });
    }
  }

  if (feedsInfo.length) {
    util.batchInsert(sql, 'feed_download', feedsInfo, function (err) {
      if (err && err.code != 'ER_DUP_ENTRY') return done(err);

      done();
    }, true, 'download = download + 1');
  } else {
    done();
  }
}
