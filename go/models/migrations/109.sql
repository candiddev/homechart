ALTER TABLE cache
  DROP CONSTRAINT cache_pkey;
ALTER TABLE cache
  ADD PRIMARY KEY (id, table_name);
