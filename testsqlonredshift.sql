CREATE TABLE raw_test (
  username text,
  language text,
  userAgent varchar(65535),
  content varchar(65535)
);


vacuum;
drop table raw_test;

copy raw_test
from 's3://transitapp-111/sessions.log-20160107.gz'
credentials 'aws_access_key_id=AKIAJ6UISEBOSHDPSOZQ;aws_secret_access_key=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' 
delimiter '|'
gzip;

select * from raw_test;

select username, userAgent, json_extract_path_text(content, 'placemarks') as placemarks from raw_test;


select * from stl_load_errors;
