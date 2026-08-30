# Module 7 — Encryption: TDE, Column-Level, Key Management

## What You'll Actually Do

Implement encryption at rest and in transit for PostgreSQL and MySQL. You'll set up Transparent Data Encryption (TDE), encrypt sensitive columns, manage encryption keys, and verify that data is actually protected.

## Content

### Encryption in Transit (TLS)

Every database connection should use TLS. No exceptions.

**PostgreSQL server config:**

Edit `postgresql.conf`:

```ini
ssl = on
ssl_cert_file = '/etc/ssl/certs/server.crt'
ssl_key_file = '/etc/ssl/private/server.key'
ssl_ca_file = '/etc/ssl/certs/ca.crt'
ssl_min_protocol_version = 'TLSv1.2'
```

Generate self-signed certs for testing:

```bash
# CA
openssl genrsa 2048 > /etc/ssl/private/ca.key
openssl req -new -x509 -nodes -days 3650 -key /etc/ssl/private/ca.key \
  -out /etc/ssl/certs/ca.crt -subj "/CN=LabCA"

# Server
openssl req -new -nodes -days 3650 \
  -out /etc/ssl/certs/server.csr -subj "/CN=postgres-server"
openssl x509 -req -in /etc/ssl/certs/server.csr \
  -CA /etc/ssl/certs/ca.crt -CAkey /etc/ssl/private/ca.key \
  -CAcreateserial -out /etc/ssl/certs/server.crt -days 3650
```

Force TLS for all connections in `pg_hba.conf`:

```ini
# Reject non-SSL connections
hostnossl all all 0.0.0.0/0 reject
hostssl all all 0.0.0.0/24 scram-sha-256
```

Verify TLS is active:

```sql
SELECT ssl, version FROM pg_stat_ssl WHERE pid = pg_backend_pid();
```

**MySQL TLS:**

```ini
[mysqld]
require_secure_transport = ON
ssl_ca = /etc/mysql/ssl/ca.pem
ssl_cert = /etc/mysql/ssl/server-cert.pem
ssl_key = /etc/mysql/ssl/server-key.pem
tls_version = TLSv1.2,TLSv1.3
```

### Column-Level Encryption

Encrypt specific columns so even database admins can't read the raw data.

**PostgreSQL with pgcrypto:**

```sql
-- Install the extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt on insert
INSERT INTO users (email, full_name, ssn_encrypted)
VALUES (
  'alice@example.com',
  'Alice Chen',
  pgp_sym_encrypt('123-45-6789', 'my-secret-key')
);

-- Decrypt on read
SELECT email, full_name,
  pgp_sym_decrypt(ssn_encrypted, 'my-secret-key') AS ssn
FROM users
WHERE email = 'alice@example.com';

-- Index on encrypted column (for searching)
CREATE INDEX idx_users_ssn ON users (encode(ssn_encrypted, 'hex'));
```

For application-level encryption (preferred for large-scale use):

```python
from cryptography.fernet import Fernet
import os

# Key management — load from environment, NEVER hardcode
ENCRYPTION_KEY = os.environ['COLUMN_ENCRYPTION_KEY'].encode()
cipher = Fernet(ENCRYPTION_KEY)

def encrypt_ssn(ssn: str) -> bytes:
    return cipher.encrypt(ssn.encode())

def decrypt_ssn(encrypted: bytes) -> str:
    return cipher.decrypt(encrypted).decode()

# Usage
encrypted = encrypt_ssn('123-45-6789')
# Store encrypted in database
# decrypted = decrypt_ssn(encrypted_from_db)
```

### Transparent Data Encryption (TDE)

TDE encrypts the entire database on disk without changing application code. The database engine handles encryption/decryption transparently.

**PostgreSQL with disk-level encryption (LUKS on Linux):**

```bash
# Create encrypted partition
sudo cryptsetup luksFormat /dev/sdb1
sudo cryptsetup luksOpen /dev/sdb1 pgdata
sudo mkfs.ext4 /dev/mapper/pgdata

# Mount and move data
sudo mount /dev/mapper/pgdata /var/lib/postgresql
# Move existing data, restart PostgreSQL
```

**MySQL TDE (InnoDB tablespace encryption):**

```ini
[mysqld]
early-plugin-load=keyring_file.so
keyring_file_data=/var/lib/mysql-keyring/keyring
innodb_default_encrypt=ON
```

```sql
-- Encrypt an existing table
ALTER TABLE users ENCRYPTION='Y';

-- Check encryption status
SELECT TABLE_SCHEMA, TABLE_NAME, CREATE_OPTIONS
FROM INFORMATION_SCHEMA.TABLES
WHERE CREATE_OPTIONS LIKE '%ENCRYPTION%';
```

**PostgreSQL with pg_tde (extension):**

```sql
-- Requires the pg_tde extension
CREATE EXTENSION pg_tde;

-- Create encrypted table
CREATE TABLE users_tde (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    data TEXT
) USING tde_heap;
```

### Key Management

Never store encryption keys alongside encrypted data.

**Environment-based key storage:**

```bash
# /etc/systemd/system/myapp.service
[Service]
Environment="DB_ENCRYPTION_KEY=base64encodedkeyhere"
# Or better: load from a file
EnvironmentFile=/etc/myapp/secrets.env
```

**Using a secrets manager (HashiCorp Vault):**

```bash
# Store key
vault kv put secret/db-encryption key="base64keyhere"

# Retrieve key in application
vault kv get -field=key secret/db-encryption
```

**Key rotation:**

```python
# Re-encrypt all sensitive data with a new key
def rotate_encryption_key(old_key: bytes, new_key: bytes):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, ssn_encrypted FROM users")
    rows = cur.fetchall()

    for row in rows:
        # Decrypt with old key
        plaintext = decrypt(row[1], old_key)
        # Re-encrypt with new key
        new_encrypted = encrypt(plaintext, new_key)
        # Update
        cur.execute(
            "UPDATE users SET ssn_encrypted = %s WHERE id = %s",
            (new_encrypted, row[0])
        )
    conn.commit()
```

### Data Masking for Non-Production

Don't copy production data to dev without masking:

```sql
-- Mask emails
SELECT
  id,
  CONCAT(LEFT(email, 2), '***@', SPLIT_PART(email, '@', 2)) AS masked_email,
  CONCAT(LEFT(ssn, 3), '-**-****') AS masked_ssn
FROM users;
```

## Assessment

**Lab task — 55 minutes**

1. Configure PostgreSQL with TLS. Verify connections are encrypted using `pg_stat_ssl`.
2. Install pgcrypto and encrypt a `ssn` column in a `users` table. Verify you can decrypt it.
3. Set up MySQL with InnoDB tablespace encryption on a table. Confirm encryption with `INFORMATION_SCHEMA`.
4. Implement a Python script that encrypts/decrypts a column using Fernet keys loaded from environment variables.
5. Document a key rotation procedure: encrypt with key A, rotate to key B, verify data is still readable.
6. Create a data masking query that produces safe versions of emails and phone numbers.

**Grading criteria:**
- PostgreSQL TLS configured and verified (15 points)
- pgcrypto encryption/decryption working (20 points)
- MySQL TDE enabled and confirmed (15 points)
- Application-level encryption script functional (20 points)
- Key rotation procedure documented and tested (15 points)
- Data masking query correct (15 points)

## Evidence

- `pg_stat_ssl` output showing TLS version and cipher
- Encryption/decryption output for pgcrypto and application-level
- MySQL `INFORMATION_SCHEMA` showing encrypted tables
- Key rotation log showing old and new keys working
- Masked data query results
