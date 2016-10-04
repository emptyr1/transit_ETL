'use strict';

var util = require('../util'),
  async = require('async'),
  moment = require('moment');

var jsonDateFormat = 'YYYY-MM-DD hh:mm:ss Z',
  dateTimeFormat = 'YYYY-MM-DD HH:mm:ss',
  dateFormat = 'YYYY-MM-DD';

exports.create = function (data, device, sql) {
  return function (done) {
    save(data, device, sql, done);
  };
};


function save(json, device, sql, done) {
  var session = {
    device_id: device.id,
    started_at: moment(json.start_date, jsonDateFormat).format(dateTimeFormat),
    ended_at: moment(json.end_date, jsonDateFormat).format(dateTimeFormat),
    created_at: new Date(),
    bundle_id: device.last_bundle_id,
    from_widget: json.from_widget || 0,
    from_lat: 0.0,
    from_lng: 0.0,
    from_simulated: false,
    to_lat: 0.0,
    to_lng: 0.0,
    to_simulated: false,
    location_count: 0
  };

  var locations = getLocations(json);

  if (locations.length) {
    session.from_lat = locations[0].latitude;
    session.from_lng = locations[0].longitude;
    session.from_simulated = locations[0].is_simulated;

    session.to_lat = locations[locations.length - 1].latitude;
    session.to_lng = locations[locations.length - 1].longitude;
    session.to_simulated = locations[locations.length - 1].is_simulated;

    session.location_count = locations.length;
  }

  sql.query('INSERT INTO session_complete SET ?', session, function (err, result) {
    if (err) return done(err);

    session.id = result.insertId;

    async.parallel([
      function (callback) {
        // saveLocations(json, session, device, sql, callback);
        process.nextTick(callback);
      },
      function (callback) {
        saveTrips(json, session, sql, callback);
      },
      function (callback) {
        saveUberRequests(json, session, device, sql, callback);
      },
      function (callback) {
        saveRouteHits(json, session, device, sql, callback);
      },
      function (callback) {
        saveNearbyViews(json, session, device, sql, callback);
      },
      function (callback) {
        saveSharingActions(json, session, device, sql, callback);
      }
    ], done);
  });
}

function getLocations(json) {
  var realLocationDicts = json.real_locations ? json.real_locations : json.locations,
    realLocations = parseLocations(realLocationDicts, 0);

  var simulatedLocationDicts = json.simulated_locations,
    simulatedLocations = parseLocations(simulatedLocationDicts, 1);

  var locations = realLocations.concat(simulatedLocations);

  locations.sort(function (a, b) {
    return a.timestamp - b.timestamp;
  });

  return locations;
}

function saveLocations(json, session, device, sql, callback) {
  var locations = getLocations(json);

  if (locations && locations.length) {
    util.batchInsert(sql, 'location', locations, callback);
  } else {
    callback();
  }
}

function parseLocations(array, session, isSimulated) {
  var jsonLoc, location, locations = [];

  if (!array) {
    return locations;
  }

  for (var i = 0; i < array.length; i++) {
    jsonLoc = array[i];

    location = {
      session_id: session.id,
      latitude: parseFloat(jsonLoc.latitude),
      longitude: parseFloat(jsonLoc.longitude),
      horizontal_accuracy: jsonLoc.horizontal_accuracy || 0,
      altitude: jsonLoc.altitude || 0,
      vertical_accuracy: jsonLoc.vertical_accuracy || 0,
      speed: jsonLoc.speed || 0,
      timestamp: moment(jsonLoc.timestamp, jsonDateFormat).format(dateTimeFormat),
      is_simulated: isSimulated
    };

    locations.push(location);
  }

  return locations;
}

function saveTrips(json, session, sql, callback) {
  var jsonTrip, trip, trips = [];

  if (!json.plan_requests) {
    callback();
    return;
  }

  for (var i = 0; i < json.plan_requests.length; i++) {
    jsonTrip = json.plan_requests[i];

    trip = {
      session_id: session.id,
      start_latitude: parseFloat(jsonTrip.start_lat),
      start_longitude: parseFloat(jsonTrip.start_lon),
      end_latitude: parseFloat(jsonTrip.end_lat),
      end_longitude: parseFloat(jsonTrip.end_lon),
      timestamp: moment(jsonTrip.timestamp, jsonDateFormat).format(dateTimeFormat),
      leave_at: null,
      arrive_by: null
    };

    if (jsonTrip.leave_at) {
      trip.leave_at = moment(jsonTrip.leave_at, jsonDateFormat).format(dateTimeFormat);
    }

    if (jsonTrip.arrive_by) {
      trip.arrive_by = moment(jsonTrip.arrive_by, jsonDateFormat).format(dateTimeFormat);
    }

    trips.push(trip);
  }

  if (trips && trips.length) {
    util.batchInsert(sql, 'trip', trips, callback);
  } else {
    callback();
  }
}

function saveUberRequests(json, session, device, sql, callback) {
  var jsonRequest, request, requests = [];

  if (!json.uber_requests) {
    callback();
    return;
  }

  for (var i = 0; i < json.uber_requests.length; i++) {
    jsonRequest = json.uber_requests[i];

    request = {
      session_id: session.id,
      device_id: device.id,
      product_name: jsonRequest.product_name,
      pickup_latitude: jsonRequest.pickup_latitude,
      pickup_longitude: jsonRequest.pickup_longitude,
      pickup_nickname: jsonRequest.pickup_nickname || null,
      drop_off_latitude: jsonRequest.drop_off_latitude || null,
      drop_off_longitude: jsonRequest.drop_off_longitude || null,
      drop_off_nickname: jsonRequest.drop_off_nickname || null,
      uber_app_installed: jsonRequest.uber_app_installed,
      timestamp: moment(jsonRequest.timestamp, jsonDateFormat).format(dateTimeFormat)
    };

    requests.push(request);
  }

  if (requests && requests.length) {
    util.batchInsert(sql, 'uber_request', requests, callback);
  } else {
    callback();
  }
}

function saveRouteHits(json, session, device, sql, callback) {
  var jsonHit, hit, fav, hits = [],
    favsAdd = [],
    favsRem = [];

  if (!json.route_hits) {
    callback();
    return;
  }

  for (var i = 0; i < json.route_hits.length; i++) {
    jsonHit = json.route_hits[i];

    hit = {
      session_id: session.id,
      route_name: jsonHit.short_name || '',
      global_route_id: jsonHit.route_id,
      headsign: jsonHit.headsign || '',
      count: jsonHit.hits || 1,
      is_favorite: jsonHit.is_favorite || 0,
      feed_code: ''
    };

    if (jsonHit.feed_code) {
      hit.feed_code = jsonHit.feed_code;
    }

    hits.push(hit);

    if (hit.is_favorite) {
      fav = {
        device_id: device.id,
        route_name: hit.route_name,
        global_route_id: hit.global_route_id || hit.route_id,
        created_at: new Date(),
        feed_code: ''
      };

      if (hit.feed_code) {
        fav.feed_code = hit.feed_code;
      } else {
        fav.feed_code = hit.feed_id;
      }

      favsAdd.push(fav);
    } else if (hit.global_route_id) {
      favsRem.push(hit.global_route_id);
    }
  }

  if (hits && hits.length) {
    util.batchInsert(sql, 'route_hit', hits, function (err) {
      if (err) {
        return callback(err);
      }

      saveFavorites(sql, favsAdd, favsRem, device, callback);
    });
  } else {
    saveFavorites(sql, favsAdd, favsRem, device, callback);
  }
}

function saveFavorites(sql, favsAdd, favsRem, device, callback) {
  if (favsAdd.length) {
    util.batchInsert(sql, 'favorite', favsAdd, function (err) {
      if (err && err.code != 'ER_DUP_ENTRY') return callback(err);

      if (favsRem.length) {
        sql.query('DELETE FROM favorite WHERE device_id = ? AND global_route_id IN (' + getIdList(favsRem) + ');', [device.id], function (err) {
          if (err) return callback(err);

          callback();
        });
      } else {
        callback();
      }
    }, true);
  } else if (favsRem.length) {
    sql.query('DELETE FROM favorite WHERE device_id = ? AND global_route_id IN (' + getIdList(favsRem) + ');', [device.id], function (err) {
      if (err) return callback(err);

      callback();
    });
  } else {
    callback();
  }
}

function saveNearbyViews(json, session, device, sql, callback) {
  var jsonView, views = [],
    feeds = [],
    feedsInfo = [],
    feed_id, global_route_id, fav, favsAdd = [],
    favsRem = [],
    view;

  feedsInfo.push({
    device_id: device.id,
    feed_id: 0,
    date: session.started_at,
    sessions: 1
  });

  if (!json.nearby_views) {
    util.batchInsert(sql, 'user_feed_session', feedsInfo, function (err) {
      if (err && err.code != 'ER_DUP_ENTRY') return callback(err);

      callback();
    }, true, 'sessions = sessions + 1');

    return;
  }

  for (var i = 0; i < json.nearby_views.length; i++) {
    jsonView = json.nearby_views[i];

    view = {
      session_id: session.id,
      device_id: device.id,
      cell_type: jsonView.cell_type || 0,
      feed_id: jsonView.feed_id || -1,
      global_route_id: jsonView.global_route_id || -1,
      tap_count: jsonView.tap_count || 0,
      is_favorite: jsonView.is_favorite || 0
    };

    if (feeds.indexOf(view.feed_id) == -1) {
      feeds.push(view.feed_id);
      feedsInfo.push({
        device_id: device.id,
        feed_id: view.feed_id,
        date: session.started_at,
        sessions: 1
      });
    }

    if (jsonView.is_favorite) {
      fav = {
        device_id: device.id,
        route_name: jsonView.route_name,
        global_route_id: jsonView.global_route_id,
        created_at: new Date(),
        feed_code: ''
      };

      if (jsonView.feed_code) {
        fav.feed_code = jsonView.feed_code;
      } else {
        fav.feed_code = jsonView.feed_id;
      }

      favsAdd.push(fav);
    } else if (jsonView.global_route_id) {
      favsRem.push(jsonView.global_route_id);
    }

    views.push(view);
  }

  if (views && views.length) {
    async.each(feedsInfo, function (session, done) {
      sql.query('INSERT INTO user_feed_session SET ? ON DUPLICATE KEY UPDATE sessions = sessions + VALUES(sessions)', [session], done);
    }, function (err) {
      if (err && err.code != 'ER_DUP_ENTRY') return callback(err);

      util.batchInsert(sql, 'nearby_view', views, function (err) {
        if (err) {
          return callback(err);
        }

        saveFavorites(sql, favsAdd, favsRem, device, callback);
      });
    });
  } else {
    saveFavorites(sql, favsAdd, favsRem, device, callback);
  }
}

function saveSharingActions(json, session, device, sql, callback) {
  var jsonRequest, request, purchase, requests = [],
    purchases = [];

  if (!json.sharing_system_actions) {
    callback();
    return;
  }

  async.each(json.sharing_system_actions, function (jsonRequest, done) {
    request = {
      session_id: session.id,
      device_id: device.id,
      map_layer_id: jsonRequest.map_layer_id,
      type: jsonRequest.type,
      placemark_id: jsonRequest.placemark_id,
      latitude: jsonRequest.latitude,
      longitude: jsonRequest.longitude,
      action: jsonRequest.action,
      timestamp: moment(jsonRequest.timestamp, jsonDateFormat).format(dateTimeFormat)
    };

    if (jsonRequest.extra) {
      request.third_party_customer_id = jsonRequest.extra.third_party_customer_id || '';
      request.user_latitude = jsonRequest.extra.user_latitude || null;
      request.user_longitude = jsonRequest.extra.user_longitude || null;
    }

    if (jsonRequest.extra && jsonRequest.extra.total_amount) {
      purchase = {
        device_id: request.device_id,
        map_layer_id: request.map_layer_id,
        action_id: 0,
        item_name: jsonRequest.extra.purchase ? jsonRequest.extra.purchase.item_name : jsonRequest.extra.item_name,
        item_count: jsonRequest.extra.purchase ? jsonRequest.extra.purchase.item_count : jsonRequest.extra.item_count,
        total_amount: jsonRequest.extra.purchase ? jsonRequest.extra.purchase.total_amount : jsonRequest.extra.total_amount,
        timestamp: request.timestamp
      };

      savePurchase(request, purchase, sql, done);
    } else {
      requests.push(request);
      process.nextTick(done);
    }
  }, function (err) {
    if (err) {
      return callback(err);
    }

    if (requests && requests.length) {
      util.batchInsert(sql, 'sharing_system_actions', requests, callback);
    } else {
      callback();
    }
  });
}

function getIdList(list) {
  return list.filter(Number).join();
}

function savePurchase(action, purchase, sql, done) {
  sql.query('INSERT INTO sharing_system_actions SET ?', [action], function (err, result) {
    if (err) return done(err);

    purchase.action_id = result.insertId;

    sql.query('INSERT INTO sharing_system_purchase SET ?', [purchase], done);
  });
}
