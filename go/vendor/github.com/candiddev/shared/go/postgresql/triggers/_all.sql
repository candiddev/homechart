CREATE OR REPLACE FUNCTION noop()
RETURNS trigger AS $$
BEGIN
	RETURN NULL;
END
$$ language plpgsql;
