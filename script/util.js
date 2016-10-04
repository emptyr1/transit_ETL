'use strict';

exports.batchInsert = function (sql, type, values, callback, handleDuplicate, updateStatement) {
  if (!values.length) {
    callback('Empty array');
    return;
  }

  var keys = Object.keys(values[0]),
    vals = [],
    item, key;

  for (var i = 0; i < values.length; i++) {
    item = [];

    for (key in values[i]) {
      item.push(values[i][key]);
    }

    if (item.length == keys.length) {
      vals.push(item);
    } else {
      console.log('Looking for ' + keys.join());
      console.log('But got ' + item.join());
    }
  }

  updateStatement = updateStatement || '';

  if (handleDuplicate) {
    if (!updateStatement) {
      for (key in keys) {
        if (updateStatement.length > 0) {
          updateStatement += ', ';
        }

        updateStatement += keys[key] + '=VALUES(' + keys[key] + ')';
      }
    }

    updateStatement = ' ON DUPLICATE KEY UPDATE ' + updateStatement;
  }

  sql.query('INSERT INTO ' + type + ' (' + keys.join() + ') VALUES ?' + updateStatement, [vals], callback);
};
