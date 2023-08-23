DROP TRIGGER IF EXISTS au_health_log_health_item ON health_log;

ALTER TABLE health_log
  ALTER COLUMN timestamp TYPE date;
ALTER TABLE health_log
  RENAME COLUMN timestamp TO date;

