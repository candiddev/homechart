ALTER TABLE
  plan_task DROP COLUMN priority;
ALTER TABLE
  plan_task ADD COLUMN color smallint not null default 0 check (color >= 0);
