UPDATE plan_task
SET
	parent_id = null
WHERE
	parent_id IS NOT NULL
	AND NOT EXISTS (
		SELECT 1
		FROM plan_task p
		WHERE p.id = plan_task.parent_id
	);

ALTER TABLE plan_task
  DROP CONSTRAINT IF EXISTS plan_task_parent_id_fkey;
ALTER TABLE plan_task
  DROP CONSTRAINT IF EXISTS plan_task_pkey;

ALTER TABLE plan_task
  ADD PRIMARY KEY (id);
ALTER TABLE plan_task
  ADD CONSTRAINT plan_task_parent_id FOREIGN KEY (parent_id) REFERENCES plan_task (id) ON DELETE CASCADE;
