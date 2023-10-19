-- Need to drop this or the public key changes will wipe Vaults.  Will be recreated by trigger migration.
DROP TRIGGER IF EXISTS au_auth_account_public_key ON auth_account;

UPDATE auth_account
  SET
      private_keys = s.keys
    , public_key = 'rsa2048public:' || public_key
FROM (
  SELECT
      jsonb_agg(
        CASE WHEN k ->> 'key' LIKE 'aes128gcm$%'
          THEN jsonb_set(
            k, '{key}', to_jsonb(
              'aes128gcm:' || split_part(k ->> 'key', ':', 2) || ':' || split_part(
                split_part(
                  k ->> 'key', '$', 2
                ), ':', 1
              )
            )
          )
          ELSE k
        END) as keys
    , id
  FROM
      auth_account
    , jsonb_array_elements(private_keys) k
  GROUP BY id
) s
WHERE auth_account.id = s.id;

UPDATE secrets_vault
  SET
    keys = s.keys
FROM (
  SELECT
      jsonb_agg(
        jsonb_set(k, '{key}', to_jsonb(
          'rsa2048oaepsha256:' || split_part(k ->> 'key', '$', 2)
        ))
      ) as keys
    , id
  FROM
      secrets_vault
    , jsonb_array_elements(keys) k
  GROUP BY id
) s
WHERE secrets_vault.id = s.id;

UPDATE secrets_value
  SET
      data_encrypted = s.data_encrypted
    , name_encrypted = replace(name_encrypted, '$', ':')
    , tags_encrypted = replace(tags_encrypted, '$', ':')
FROM (
  SELECT
      array_agg(replace(k, '$', ':')) as data_encrypted
    , id
  FROM
      secrets_value
    , unnest(data_encrypted) k
  GROUP BY id
) s
WHERE secrets_value.id = s.id;
