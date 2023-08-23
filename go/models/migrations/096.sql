ALTER TABLE plan_task
	ADD COLUMN inventory_item_id UUID REFERENCES inventory_item (id) ON DELETE CASCADE; 
