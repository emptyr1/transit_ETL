CREATE SCHEMA `transit_stats` DEFAULT CHARACTER SET utf8 COLLATE utf8_bin ;
USE `transit_stats`;

CREATE TABLE `device` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `udid` varchar(255) COLLATE utf8_bin NOT NULL,
  `language` varchar(10) COLLATE utf8_bin DEFAULT NULL,
  `type` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `app_name` varchar(200) COLLATE utf8_bin DEFAULT 'Transit',
  `app_version` varchar(10) COLLATE utf8_bin DEFAULT NULL,
  `os_version` varchar(50) COLLATE utf8_bin DEFAULT NULL,
  `model` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `last_used` datetime DEFAULT NULL,
  `last_bundle_id` int(11) DEFAULT NULL,
  `push_token` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `bluetooth_enabled` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `udid` (`udid`),
  KEY `language` (`language`),
  KEY `type` (`type`),
  KEY `created_at` (`created_at`),
  KEY `last_used` (`last_used`),
  KEY `last_bundle_id` (`last_bundle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `favorite` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `device_id` bigint(20) NOT NULL,
  `route_name` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `feed_code` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `global_route_id` bigint(20) DEFAULT NULL,
  `send_push` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_route` (`device_id`,`route_name`,`feed_code`),
  KEY `device_id` (`device_id`),
  KEY `route` (`route_name`,`feed_code`),
  KEY `created_at` (`created_at`),
  KEY `feed_code` (`feed_code`),
  KEY `route_name` (`route_name`),
  KEY `global_route_id` (`global_route_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `feed_download` (
  `feed_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `download` int(11) DEFAULT '0',
  `users` int(11) DEFAULT '0',
  `sessions` int(11) DEFAULT '0',
  `users_week` int(11) DEFAULT '0',
  `users_month` int(11) DEFAULT '0',
  PRIMARY KEY (`feed_id`,`date`),
  KEY `date` (`date`),
  KEY `feed_id` (`feed_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `installed_app` (
  `device_id` bigint(20) NOT NULL,
  `name` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT '',
  `installed` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`device_id`,`name`),
  KEY `installed` (`installed`),
  KEY `name` (`name`),
  KEY `installed_name` (`installed`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `placemark` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `device_id` int(11) DEFAULT NULL,
  `name` varchar(200) COLLATE utf8_bin DEFAULT NULL,
  `address` varchar(250) COLLATE utf8_bin DEFAULT NULL,
  `sub_locality` varchar(250) COLLATE utf8_bin DEFAULT NULL,
  `locality` varchar(250) COLLATE utf8_bin DEFAULT NULL,
  `country` varchar(250) COLLATE utf8_bin DEFAULT NULL,
  `country_code` varchar(3) COLLATE utf8_bin DEFAULT NULL,
  `latitude` float(7,3) DEFAULT NULL,
  `longitude` float(7,3) DEFAULT NULL,
  `type` smallint(2) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `postal_code` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx1` (`device_id`,`type`),
  KEY `type` (`type`),
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`),
  KEY `device_id` (`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `session_complete` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `device_id` bigint(20) NOT NULL,
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `bundle_id` int(11) DEFAULT NULL,
  `from_lat` float(9,5) NOT NULL,
  `from_lng` float(9,5) NOT NULL,
  `from_simulated` tinyint(1) DEFAULT '0',
  `to_lat` float(9,5) NOT NULL,
  `to_lng` float(9,5) NOT NULL,
  `to_simulated` tinyint(1) DEFAULT '0',
  `location_count` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `from_widget` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `device_id` (`device_id`),
  KEY `started_at` (`started_at`),
  KEY `ended_at` (`ended_at`),
  KEY `bundle_id` (`bundle_id`),
  KEY `created_at` (`created_at`),
  KEY `start_bundle` (`bundle_id`,`started_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `sharing_system_actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` int(11) DEFAULT NULL,
  `session_id` int(11) DEFAULT NULL,
  `map_layer_id` int(11) DEFAULT NULL,
  `type` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `placemark_id` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `latitude` float(9,5) DEFAULT NULL,
  `longitude` float(9,5) DEFAULT NULL,
  `action` varchar(45) COLLATE utf8_bin DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `user_latitude` float(9,5) DEFAULT NULL,
  `user_longitude` float(9,5) DEFAULT NULL,
  `third_party_customer_id` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `device_id` (`device_id`),
  KEY `session_id` (`session_id`),
  KEY `position` (`latitude`,`longitude`),
  KEY `time` (`timestamp`),
  KEY `action` (`action`),
  KEY `type` (`type`),
  KEY `action_time_type` (`type`,`action`,`timestamp`),
  KEY `map_layer_id` (`map_layer_id`),
  KEY `third_party_customer_id` (`third_party_customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `sharing_system_purchase` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` int(11) DEFAULT NULL,
  `map_layer_id` int(11) DEFAULT NULL,
  `action_id` int(11) DEFAULT NULL,
  `item_name` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `item_count` int(3) DEFAULT NULL,
  `total_amount` decimal(10,0) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `device_id` (`device_id`),
  KEY `map_layer_id` (`map_layer_id`),
  KEY `action_id` (`action_id`),
  KEY `total_amount` (`total_amount`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `trip` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `session_id` bigint(20) NOT NULL,
  `start_latitude` float(9,5) DEFAULT NULL,
  `start_longitude` float(9,5) DEFAULT NULL,
  `start_query` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `start_use_suggestion` tinyint(4) NOT NULL DEFAULT '0',
  `end_latitude` float(9,5) DEFAULT NULL,
  `end_longitude` float(9,5) DEFAULT NULL,
  `end_query` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `end_use_suggestion` tinyint(1) NOT NULL DEFAULT '0',
  `leave_at` datetime DEFAULT NULL,
  `arrive_by` datetime DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `start_position` (`start_latitude`,`start_longitude`),
  KEY `end_position` (`end_latitude`,`end_longitude`),
  KEY `leave_at` (`leave_at`),
  KEY `arrive_by` (`arrive_by`),
  KEY `start_suggestion` (`start_use_suggestion`),
  KEY `end_suggestion` (`end_use_suggestion`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `uber_request` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `device_id` int(11) DEFAULT NULL,
  `session_id` int(11) DEFAULT NULL,
  `product_name` varchar(250) COLLATE utf8_bin DEFAULT NULL,
  `pickup_latitude` float(9,5) DEFAULT NULL,
  `pickup_longitude` float(9,5) DEFAULT NULL,
  `pickup_nickname` varchar(250) COLLATE utf8_bin DEFAULT NULL,
  `drop_off_latitude` float(9,5) DEFAULT NULL,
  `drop_off_longitude` float(9,5) DEFAULT NULL,
  `drop_off_nickname` varchar(250) COLLATE utf8_bin DEFAULT NULL,
  `uber_app_installed` tinyint(1) DEFAULT '0',
  `timestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `device_id` (`device_id`),
  KEY `session_id` (`session_id`),
  KEY `product_name` (`product_name`),
  KEY `pickup_latitude` (`pickup_latitude`,`pickup_longitude`),
  KEY `drop_off_latitude` (`drop_off_latitude`,`drop_off_longitude`),
  KEY `uber_app_installed` (`uber_app_installed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `user_feed_session` (
  `device_id` bigint(20) NOT NULL,
  `feed_id` bigint(20) NOT NULL,
  `date` date NOT NULL,
  `sessions` int(11) DEFAULT '1',
  PRIMARY KEY (`device_id`,`feed_id`,`date`),
  KEY `date` (`date`),
  KEY `device` (`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `location` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) DEFAULT NULL,
  `latitude` float(9,5) DEFAULT NULL,
  `longitude` float(9,5) DEFAULT NULL,
  `horizontal_accuracy` float(9,5) DEFAULT NULL,
  `altitude` float(9,5) DEFAULT NULL,
  `vertical_accuracy` float(9,5) DEFAULT NULL,
  `speed` float(9,5) DEFAULT NULL,
  `timestamp` datetime DEFAULT NULL,
  `is_simulated` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `is_simulated` (`is_simulated`),
  KEY `timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `nearby_view` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) DEFAULT NULL,
  `device_id` int(11) DEFAULT NULL,
  `cell_type` int(11) DEFAULT NULL,
  `feed_id` int(11) DEFAULT NULL,
  `global_route_id` int(11) DEFAULT NULL,
  `tap_count` int(11) DEFAULT NULL,
  `is_favorite` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `global_route_id` (`global_route_id`),
  KEY `is_favorite` (`is_favorite`),
  KEY `device` (`device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `route_hit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) DEFAULT NULL,
  `route_name` varchar(250) COLLATE utf8_bin DEFAULT NULL,
  `global_route_id` int(11) DEFAULT NULL,
  `headsign` varchar(250) COLLATE utf8_bin DEFAULT NULL,
  `count` int(11) DEFAULT NULL,
  `is_favorite` tinyint(1) DEFAULT '0',
  `feed_code` varchar(250) COLLATE utf8_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `global_route_id` (`global_route_id`),
  KEY `is_favorite` (`is_favorite`),
  KEY `feed_code` (`feed_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

