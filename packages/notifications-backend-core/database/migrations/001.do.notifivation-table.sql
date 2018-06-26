CREATE TABLE notification (
  id SERIAL PRIMARY KEY,
  notify JSON NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT NOW(),
  read_at timestamp with time zone,
  deleted_at timestamp with time zone,
  last_notified_at timestamp with time zone,
  send_strategy varchar(256) default 'default',
  notified_with JSON NOT null,
  user_identifier varchar(256) NOT null
);

