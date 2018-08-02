CREATE TABLE notification (
  id SERIAL PRIMARY KEY,
  notify JSON NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT NOW(),
  read_at timestamp with time zone default null,
  deleted_at timestamp with time zone default null,
  send_strategy varchar(256) default 'default',
  user_identifier varchar(256) NOT null
);

CREATE TABLE sent_by (
  id SERIAL PRIMARY KEY,
  notification_id INTEGER NOT NULL REFERENCES notification (id) ON DELETE CASCADE,
  channel varchar(255) NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sent_by_notification_id_index ON sent_by (notification_id);

