# Module 7: Encryption

Encryption protects data at three states: at rest (stored on disk), in transit (moving across the network), and in use (being processed in memory). This module covers the practical implementation of each. We will configure Transparent Data Encryption (TDE), implement column-level encryption for specific sensitive fields, set up SSL/TLS for database connections, and discuss key management strategies that do not involve storing encryption keys next to the data they protect. The scenario walks through encrypting a production PostgreSQL database handling payment card data.

## Transparent Data Encryption (TDE)

TDE encrypts the entire database at the storage level. The database engine encrypts data before writing it to disk and decrypts it when reading. The application does not need to change: encryption and decryption are transparent to queries.

**MySQL TDE (InnoDB Tablespace Encryption):**

```ini
# my.cnf
[mysqld]
# Enable keyring plugin for key management
early-plugin-load=keyring_file.so
keyring_file_data=/var/lib/mysql-keyring/keyring

# Enable tablespace encryption by default
default_table_encryption=ON

# Encryption for redo log
innodb_redo_log_encrypt=ON

# Encryption for undo log
innodb_undo_log_encrypt=ON

# Encryption for binary log
binlog_encryption=ON
```

```sql
-- Verify encryption is enabled
SELECT * FROM information_schema.innodb_tablespaces
WHERE flag & 8192 = 8192;  -- 8192 = encrypted tablespace flag

-- Encrypt an existing table (online, no downtime)
ALTER TABLE orders ENCRYPTION='Y';

-- Create a new encrypted table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    amount DECIMAL(10,2),
    card_last_four VARCHAR(4)
) ENCRYPTION='Y';
```

MySQL TDE uses AES-256-CBC for tablespace encryption. The keyring plugin manages the encryption keys. The `keyring_file` plugin stores keys in a local file: suitable for single-server deployments. For production with multiple servers, use `keyring_okv` (KMIP-compatible) or `keyring_hashicorp` (HashiCorp Vault).

**PostgreSQL TDE (pgcrypto or File-Level Encryption):**

PostgreSQL does not have native TDE in the community edition. The options are:

1. **Filesystem-level encryption (LUKS/dm-crypt):** Encrypt the entire data partition. Simple, fast, but if the filesystem is mounted, the data is accessible.

```bash
# Create encrypted volume
sudo cryptsetup luksFormat /dev/sdb1
sudo cryptsetup luksOpen /dev/sdb1 pgdata_encrypted
sudo mkfs.ext4 /dev/mapper/pgdata_encrypted
sudo mount /dev/mapper/pgdata_encrypted /var/lib/postgresql/16/main

# Auto-mount at boot (requires key file or passphrase)
echo "pgdata_encrypted /dev/sdb1 /etc/keys/pgdata.key luks" | sudo tee -a /etc/crypttab
```

2. **Column-level encryption with pgcrypto:** Encrypt specific columns, not the entire database. More granular control but requires application changes.

3. **pgcrypto extension (built-in):**

```sql
-- Install pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt data using pgp_sym_encrypt
INSERT INTO payments (card_number, amount)
VALUES (pgp_sym_encrypt('4111111111111111', 'encryption_key'), 99.99);

-- Decrypt data
SELECT pgp_sym_decrypt(card_number, 'encryption_key') FROM payments;
```

The trade-off with pgcrypto: queries cannot use encrypted columns in WHERE clauses without decrypting first. This means full table scans for encrypted column queries. TDE avoids this because the encryption is transparent to the query engine.

**SQL Server TDE:**

```sql
-- Create a master key
CREATE MASTER KEY ENCRYPTION BY PASSWORD = 'StrongPassword123!';

-- Create a certificate protected by the master key
CREATE CERTIFICATE MyServerCert WITH SUBJECT = 'TDE Certificate';

-- Create a database encryption key
USE mydb;
CREATE DATABASE ENCRYPTION KEY
WITH ALGORITHM = AES_256
ENCRYPTION BY SERVER CERTIFICATE MyServerCert;

-- Enable TDE
ALTER DATABASE mydb SET ENCRYPTION ON;
```

## Column-Level Encryption

Column-level encryption protects specific sensitive fields without encrypting the entire database. This is useful when only certain columns contain sensitive data (credit card numbers, SSNs, health records).

**PostgreSQL with pgcrypto:**

```sql
-- Install pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create table with encrypted column
CREATE TABLE customer_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    card_number BYTEA,  -- Binary data for encrypted value
    card_holder TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert encrypted data
INSERT INTO customer_payments (customer_id, card_number, card_holder, expiry_date, amount)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    pgp_sym_encrypt('4111111111111111', 'aes_key_from_vault'),
    'John Doe',
    '12/2028',
    149.99
);

-- Query encrypted data (must decrypt for comparison)
SELECT id, customer_id,
       pgp_sym_decrypt(card_number, 'aes_key_from_vault') AS card_number,
       card_holder, amount
FROM customer_payments
WHERE customer_id = '11111111-1111-1111-1111-111111111111';

-- Search by encrypted column (requires decrypting all rows: slow)
SELECT * FROM customer_payments
WHERE pgp_sym_decrypt(card_number, 'aes_key_from_vault') = '4111111111111111';
```

The problem with searching encrypted columns is obvious: the database must decrypt every row to compare values. For large tables, this is unacceptable. The solution is to store a hash of the searchable value alongside the encrypted value:

```sql
CREATE TABLE customer_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    card_number BYTEA NOT NULL,
    card_number_hash BYTEA NOT NULL,  -- Hash for lookups
    card_holder TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL
);

-- Insert with hash
INSERT INTO customer_payments (customer_id, card_number, card_number_hash, card_holder, amount)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    pgp_sym_encrypt('4111111111111111', 'aes_key'),
    digest('4111111111111111', 'sha256'),  -- SHA-256 hash
    'John Doe',
    149.99
);

-- Create index on the hash for fast lookups
CREATE INDEX idx_card_hash ON customer_payments USING hash (card_number_hash);

-- Lookup by hash (fast, uses index)
SELECT * FROM customer_payments
WHERE card_number_hash = digest('4111111111111111', 'sha256');
```

**Application-Level Encryption:**

```python
# Python example using cryptography library
from cryptography.fernet import Fernet
import hashlib

# Generate encryption key (store in vault, not in code)
key = Fernet.generate_key()
cipher = Fernet(key)

# Encrypt card number
card_number = '4111111111111111'
encrypted = cipher.encrypt(card_number.encode())
# Store encrypted in database

# Decrypt card number
decrypted = cipher.decrypt(encrypted).decode()
# Use decrypted value

# Create hash for lookups
card_hash = hashlib.sha256(card_number.encode()).hexdigest()
# Store hash in database alongside encrypted value
```

```java
// Java example using Jasypt
import org.jasypt.util.text.BasicTextEncryptor;

BasicTextEncryptor encryptor = new BasicTextEncryptor();
encryptor.setPassword("encryption_key_from_vault");

// Encrypt
String encrypted = encryptor.encrypt("4111111111111111");

// Decrypt
String decrypted = encryptor.decrypt(encrypted);
```

**Format-Preserving Encryption (FPE):**

FPE encrypts data while preserving its format. A 16-digit credit card number remains a 16-digit number after encryption. This is useful when downstream systems expect a specific format:

```python
# Using format-preserving encryption
# The encrypted output is still a valid credit card format
from FF3 import FF3Cipher

# FF3 algorithm (NIST approved)
cipher = FF3Cipher('EF4359D8D5991F2D', 'D93FB73F', radix=10)

# Encrypt: 1234567812345678 -> 7482309561489203
encrypted = cipher.encrypt('1234567812345678')

# Decrypt: 7482309561489203 -> 1234567812345678
decrypted = cipher.decrypt(encrypted)
```

FPE maintains referential integrity in the database: you can still use the encrypted value in foreign keys and indexes.

## Encryption Algorithms and Hashing

Choosing the right algorithm matters. Using a weak algorithm is like using a flimsy lock: it looks like security but provides little protection.

**Symmetric Encryption (same key for encrypt and decrypt):**

AES (Advanced Encryption Standard) is the standard for symmetric encryption. AES-256 is the recommended variant: it uses a 256-bit key and has no known practical attacks.

```python
# AES-256-GCM (authenticated encryption)
# GCM mode provides both confidentiality and integrity
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

key = AESGCM.generate_key(bit_length=256)  # 32 bytes
aesgcm = AESGCM(key)
nonce = os.urandom(12)  # Unique nonce per encryption

# Encrypt with associated data (AAD)
# AAD is authenticated but not encrypted: useful for metadata
plaintext = b'4111111111111111'
associated_data = b'customer:12345'
ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data)

# Decrypt
decrypted = aesgcm.decrypt(nonce, ciphertext, associated_data)
assert decrypted == plaintext
```

AES-256-GCM is preferred over AES-CBC because GCM provides authentication (detects tampering) while CBC does not. If an attacker modifies the ciphertext, CBC decryption produces garbage without detecting the modification. GCM detects the modification and throws an error.

**Asymmetric Encryption (public/private key pair):**

RSA and ECC (Elliptic Curve Cryptography) are used for key exchange and digital signatures, not for bulk data encryption. The typical pattern: use asymmetric encryption to securely exchange a symmetric key, then use the symmetric key for data encryption.

```python
# RSA key exchange example
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

# Generate RSA key pair
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()

# Encrypt symmetric key with public key
symmetric_key = b'32_byte_aes_key_for_data_encryption'
encrypted_key = public_key.encrypt(
    symmetric_key,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)

# Decrypt symmetric key with private key
decrypted_key = private_key.decrypt(
    encrypted_key,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)
assert decrypted_key == symmetric_key
```

**Hashing (one-way,不可逆):**

Hashing produces a fixed-size fingerprint of data. Unlike encryption, hashing is irreversible: you cannot recover the original data from the hash. Hashing is used for password storage, data integrity verification, and lookup indexes.

```python
import hashlib

# SHA-256 for data integrity
data = b'sensitive information'
hash_value = hashlib.sha256(data).hexdigest()
# Store hash_value in database, not the original data

# Verify integrity
assert hashlib.sha256(data).hexdigest() == hash_value

# bcrypt for password storage (slow hash, resistant to brute force)
import bcrypt
password = b'user_password'
hashed = bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))
# rounds=12 means 2^12 iterations: slow by design

# Verify password
assert bcrypt.checkpw(password, hashed)
```

**Password Hashing: Never Use MD5 or SHA-256:**

MD5 and SHA-256 are fast hashes. An attacker with a GPU can compute billions of MD5 hashes per second, making brute-force attacks practical. Use bcrypt, scrypt, or Argon2: these are slow, memory-hard hashes designed for password storage.

```python
# WRONG: Fast hash for passwords
hashed = hashlib.sha256(password.encode()).hexdigest()
# An attacker can try 10 billion passwords per second with a GPU

# RIGHT: Slow hash for passwords
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
# An attacker can try ~10,000 passwords per second: 1 million times slower
```

**Encryption Performance Considerations:**

Encryption adds CPU overhead. The impact depends on the algorithm, data size, and whether the CPU supports hardware acceleration.

```python
# Benchmark encryption performance
import time
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)
data = b'x' * 1024  # 1KB of data

# Measure encryption throughput
iterations = 10000
start = time.time()
for _ in range(iterations):
    nonce = os.urandom(12)
    aesgcm.encrypt(nonce, data, None)
elapsed = time.time() - start
throughput = (iterations * 1024) / elapsed / 1024 / 1024
print(f"Encryption throughput: {throughput:.1f} MB/s")
# Modern CPUs with AES-NI: 2-5 GB/s
# Without hardware acceleration: 200-500 MB/s
```

AES-NI (AES New Instructions) is a CPU extension that accelerates AES operations. Most modern CPUs (Intel since 2010, AMD since 2011) include AES-NI. Check for hardware support:

```bash
# Linux
grep -o aes /proc/cpuinfo | head -1
# Output: aes (if supported)

# Verify OpenSSL uses hardware acceleration
openssl engine -t -c
# Look for "aesni" or "aes" in the output
```

With hardware acceleration, AES-256-GCM encryption adds less than 5% overhead to database operations. Without it, the overhead can reach 15-20% for write-heavy workloads. The trade-off is almost always worth it for sensitive data.

## Key Management

Encryption is only as strong as the key management. Storing encryption keys in the same database or on the same server as the encrypted data defeats the purpose.

**Key Management Principles:**

1. **Separation of duties:** The person who manages the database should not manage the encryption keys. If the database is compromised, the attacker gets data but not the keys.

2. **Key rotation:** Rotate encryption keys regularly. If a key is compromised, only data encrypted with that key is affected. The rotation period depends on the sensitivity of the data: financial data might rotate quarterly, healthcare data annually.

3. **Key escrow:** Maintain secure backups of encryption keys. If keys are lost, the encrypted data is permanently unrecoverable.

4. **Access control:** Restrict who can access encryption keys. Log all key access.

**HashiCorp Vault for Database Key Management:**

```bash
# Start Vault server
vault server -dev -dev-root-token-id=root

# Enable the transit secrets engine
vault secrets enable transit

# Create an encryption key
vault write -f transit/keys/card_encryption type=aes256-gcm96

# Encrypt data
vault write transit/encrypt/card_encryption \
  plaintext=$(echo -n '4111111111111111' | base64)

# Decrypt data
vault write transit/decrypt/card_encryption \
  ciphertext="vault:v1:..."

# Rotate the key (re-encrypt data with new key)
vault write -f transit/keys/card_encryption/rotate

# Re-encrypt existing data with the new key
vault write -f transit/keys/card_encryption/rewind \
  min_version=1 max_version=2
```

**PostgreSQL Integration with Vault:**

```sql
-- Use pgcrypto with a key from Vault
-- In practice, the application retrieves the key from Vault
-- and passes it to the database session

-- Application code (Python)
import hvac  # HashiCorp Vault client

client = hvac.Client(url='https://vault.internal:8200', token=vault_token)

# Retrieve encryption key
key_response = client.secrets.transit.export_key(
    name='card_encryption',
    key_type='aes256-gcm96'
)
encryption_key = key_response['data']['key']

# Set the key for the database session
db.execute("SET app.encryption_key = %s", (encryption_key,))

# Use the key in queries
db.execute("""
    INSERT INTO payments (card_number)
    VALUES (pgp_sym_encrypt('4111111111111111', current_setting('app.encryption_key')))
""")
```

**AWS KMS for Key Management:**

```python
# Python example using AWS KMS
import boto3

kms = boto3.client('kms')

# Generate a data key
response = kms.generate_data_key(
    KeyId='alias/my-database-key',
    KeySpec='AES_256'
)

plaintext_key = response['Plaintext']  # Use this to encrypt data
encrypted_key = response['CiphertextBlob']  # Store this in the database

# Encrypt data
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
aesgcm = AESGCM(plaintext_key)
nonce = os.urandom(12)
encrypted = aesgcm.encrypt(nonce, b'4111111111111111', None)

# Store encrypted data and nonce in database
# Store encrypted_key (CiphertextBlob) alongside for decryption
```

**Key Rotation Strategy:**

```sql
-- Store key version with encrypted data
CREATE TABLE encrypted_payments (
    id UUID PRIMARY KEY,
    card_number BYTEA NOT NULL,
    key_version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- When rotating keys:
-- 1. Generate new key in Vault/KMS
-- 2. Update application to use new key for new writes
-- 3. Background job to re-encrypt existing data with new key
UPDATE encrypted_payments
SET card_number = pgp_sym_encrypt(
    pgp_sym_decrypt(card_number, old_key),
    new_key
),
key_version = 2
WHERE key_version = 1;

-- 4. Remove old key from Vault/KMS
```

## SSL/TLS for Database Connections

SSL/TLS encrypts the connection between the application and the database. Without TLS, database credentials and query data travel in plaintext across the network.

**PostgreSQL TLS Configuration:**

```ini
# postgresql.conf
ssl = on
ssl_cert_file = '/etc/postgresql/ssl/server.crt'
ssl_key_file = '/etc/postgresql/ssl/server.key'
ssl_ca_file = '/etc/postgresql/ssl/ca.crt'
ssl_min_protocol_version = 'TLSv1.2'
ssl_ciphers = 'HIGH:!aNULL:!MD5:!3DES:!RC4'
```

```ini
# pg_hba.conf: require SSL for all connections
hostssl  myapp  appuser  10.0.1.0/24  scram-sha-256
hostnossl all    all      10.0.1.0/24  reject
```

**Generate TLS Certificates:**

```bash
# Generate CA
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 \
  -out ca.pem -subj "/CN=Database CA"

# Generate server certificate
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr \
  -subj "/CN=postgresql.internal"
openssl x509 -req -in server.csr -CA ca.pem -CAkey ca.key \
  -CAcreateserial -out server.crt -days 365 -sha256

# Generate client certificate
openssl genrsa -out client.key 2048
openssl req -new -key client.key -out client.csr \
  -subj "/CN=appuser"
openssl x509 -req -in client.csr -CA ca.pem -CAkey ca.key \
  -CAcreateserial -out client.crt -days 365 -sha256
```

**Application Connection with TLS:**

```python
# Python with psycopg2
import psycopg2

conn = psycopg2.connect(
    host='postgresql.internal',
    dbname='myapp',
    user='appuser',
    password='secure_password',
    sslmode='verify-full',  # Verify server certificate
    sslcert='/path/to/client.crt',
    sslkey='/path/to/client.key',
    sslrootcert='/path/to/ca.crt'
)
```

```javascript
// Node.js with pg
const { Client } = require('pg');

const client = new Client({
  host: 'postgresql.internal',
  database: 'myapp',
  user: 'appuser',
  password: 'secure_password',
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca.crt'),
    key: fs.readFileSync('/path/to/client.key'),
    cert: fs.readFileSync('/path/to/client.crt')
  }
});
```

```java
// Java with JDBC
String url = "jdbc:postgresql://postgresql.internal:5432/myapp"
    + "?ssl=true"
    + "&sslmode=verify-full"
    + "&sslcert=/path/to/client.crt"
    + "&sslkey=/path/to/client.key"
    + "&sslrootcert=/path/to/ca.crt";
```

**TLS Certificate Management:**

TLS certificates expire. When they do, database connections fail. Automate certificate renewal and monitor expiration.

```bash
# Check certificate expiration date
openssl x509 -in /etc/postgresql/ssl/server.crt -noout -dates
# notBefore=Jan 01 00:00:00 2026 GMT
# notAfter=Jan 01 00:00:00 2027 GMT

# Set up certificate renewal monitoring
#!/bin/bash
# check_cert_expiry.sh
CERT="/etc/postgresql/ssl/server.crt"
EXPIRY=$(openssl x509 -in "$CERT" -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

if [ "$DAYS_LEFT" -lt 30 ]; then
    echo "ALERT: TLS certificate expires in $DAYS_LEFT days"
    # Send alert to monitoring system
fi
```

Certificate renewal process:
1. Generate new server key and CSR
2. Sign with your CA
3. Replace the old certificate
4. Reload PostgreSQL: `SELECT pg_reload_conf();`
5. Verify connections still work: `SELECT * FROM pg_stat_ssl WHERE ssl = true;`

The entire process should take under 15 minutes and cause zero downtime because PostgreSQL reloads certificates without restarting.

**TLS Protocol and Cipher Configuration:**

Not all TLS versions and ciphers are secure. Disable old versions and weak ciphers:

```ini
# postgresql.conf: secure TLS configuration
ssl_min_protocol_version = 'TLSv1.2'  # Disable TLS 1.0 and 1.1
ssl_ciphers = 'HIGH:!aNULL:!MD5:!3DES:!RC4:!SEED:!IDEA:!CAMELLIA'
```

For even stricter security, prefer TLS 1.3:

```ini
ssl_min_protocol_version = 'TLSv1.3'
```

TLS 1.3 is faster (fewer round trips) and more secure (no legacy ciphers) than TLS 1.2. The only reason to support TLS 1.2 is backward compatibility with older clients.

## MySQL TLS Configuration:

```ini
# my.cnf
[mysqld]
ssl-ca = /etc/mysql/ssl/ca.pem
ssl-cert = /etc/mysql/ssl/server-cert.pem
ssl-key = /etc/mysql/ssl/server-key.pem
require_secure_transport = ON
tls_version = TLSv1.2,TLSv1.3
```

```sql
-- Verify TLS is active
SHOW VARIABLES LIKE '%ssl%';

-- Check current connection TLS status
SHOW STATUS LIKE 'Ssl_cipher';
-- If empty, the connection is not encrypted
```

**Mutual TLS (mTLS):**

Mutual TLS requires both the server and the client to present certificates. This provides authentication in both directions: the server verifies the client, and the client verifies the server. It prevents man-in-the-middle attacks even if an attacker has a valid server certificate.

```ini
# pg_hba.conf: require client certificates
hostssl  myapp  appuser  10.0.1.0/24  cert
```

The `cert` authentication method requires the client to present a certificate signed by a CA that PostgreSQL trusts. The certificate's CN (Common Name) is matched against the database username.

## Real Scenario: Encrypting a Production Database

You are the DBA for a payment processing system. The company must comply with PCI DSS requirements for protecting cardholder data. The current database stores credit card numbers, expiration dates, and cardholder names. The task: implement encryption that meets PCI DSS requirements without disrupting the existing application.

**Current State:**

```sql
-- Existing table with plaintext card data
CREATE TABLE payment_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    card_number VARCHAR(16) NOT NULL,
    expiry_date VARCHAR(5) NOT NULL,
    cardholder_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application queries this table directly
SELECT * FROM payment_cards WHERE customer_id = $1;
INSERT INTO payment_cards (customer_id, card_number, expiry_date, cardholder_name) VALUES ($1, $2, $3, $4);
```

**Step 1: Set up key management.**

Deploy HashiCorp Vault and enable the transit engine:

```bash
vault secrets enable transit
vault write -f transit/keys/card_encryption type=aes256-gcm96
```

**Step 2: Create encrypted table.**

```sql
CREATE TABLE payment_cards_encrypted (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    card_number BYTEA NOT NULL,
    card_number_hash BYTEA NOT NULL,
    expiry_date BYTEA NOT NULL,
    cardholder_name TEXT NOT NULL,
    key_version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on hash for lookups
CREATE INDEX idx_cards_customer ON payment_cards_encrypted(customer_id);
CREATE INDEX idx_cards_hash ON payment_cards_encrypted USING hash (card_number_hash);
```

**Step 3: Migrate existing data.**

```python
import psycopg2
import hvac
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Connect to Vault
vault = hvac.Client(url='https://vault.internal:8200')
key_data = vault.secrets.transit.export_key(name='card_encryption', key_type='aes256-gcm96')
encryption_key = bytes.fromhex(key_data['data']['key'])

# Connect to database
db = psycopg2.connect('dbname=myapp host=postgresql.internal')

# Migrate data in batches
cursor = db.cursor()
cursor.execute("SELECT id, card_number, expiry_date FROM payment_cards")
batch = cursor.fetchmany(1000)

while batch:
    for row in batch:
        card_id, card_number, expiry_date = row

        # Encrypt card number
        aesgcm = AESGCM(encryption_key)
        nonce = os.urandom(12)
        encrypted_card = aesgcm.encrypt(nonce, card_number.encode(), None)
        encrypted_expiry = aesgcm.encrypt(nonce, expiry_date.encode(), None)

        # Create hash for lookups
        card_hash = hashlib.sha256(card_number.encode()).digest()

        # Insert encrypted data
        cursor2 = db.cursor()
        cursor2.execute("""
            INSERT INTO payment_cards_encrypted
            (id, customer_id, card_number, card_number_hash, expiry_date, cardholder_name)
            SELECT id, customer_id, %s, %s, %s, cardholder_name
            FROM payment_cards WHERE id = %s
        """, (encrypted_card, card_hash, encrypted_expiry, card_id))

    db.commit()
    batch = cursor.fetchmany(1000)

# Verify migration
cursor.execute("SELECT COUNT(*) FROM payment_cards")
old_count = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM payment_cards_encrypted")
new_count = cursor.fetchone()[0]
assert old_count == new_count, f"Migration incomplete: {old_count} vs {new_count}"
```

**Step 4: Update application code.**

```python
# Before: direct query
# cursor.execute("SELECT * FROM payment_cards WHERE customer_id = %s", (customer_id,))

# After: decrypt after retrieval
cursor.execute("""
    SELECT id, card_number, expiry_date, cardholder_name
    FROM payment_cards_encrypted
    WHERE customer_id = %s
""", (customer_id,))

for row in cursor.fetchall():
    card_id, encrypted_card, encrypted_expiry, name = row
    card_number = aesgcm.decrypt(nonce, encrypted_card, None).decode()
    expiry = aesgcm.decrypt(nonce, encrypted_expiry, None).decode()
    # Mask card number for display: ****-****-****-1234
    masked = f"****-****-****-{card_number[-4:]}"
```

**Step 5: Enable TLS and restrict access.**

```ini
# postgresql.conf
ssl = on
ssl_cert_file = '/etc/postgresql/ssl/server.crt'
ssl_key_file = '/etc/postgresql/ssl/server.key'
ssl_ca_file = '/etc/postgresql/ssl/ca.crt'

# pg_hba.conf: only allow encrypted connections
hostssl  myapp  appuser  10.0.1.0/24  cert
hostnossl all    all      0.0.0.0/0   reject
```

**Step 6: Audit and verify.**

```sql
-- Verify all connections are encrypted
SELECT * FROM pg_stat_ssl
JOIN pg_stat_activity ON pg_stat_ssl.pid = pg_stat_activity.pid
WHERE pg_stat_ssl.ssl = false;

-- Verify encryption is active on the table
SELECT relname, pg_size_pretty(pg_relation_size(oid))
FROM pg_class WHERE relname = 'payment_cards_encrypted';

-- Verify key rotation works
vault write -f transit/keys/card_encryption/rotate
-- Application continues working with new key version
```

**PCI DSS Compliance Checklist:**

- Cardholder data is encrypted at rest (column-level encryption with AES-256)
- Encryption keys are managed separately from the database (HashiCorp Vault)
- All database connections use TLS 1.2 or higher
- Mutual TLS authenticates both client and server
- Key rotation is supported without downtime
- Audit logs capture all access to encrypted data
- Plaintext card numbers are never logged or stored after migration

## Assessment

**Lab Tasks:**

1. Configure TDE on a MySQL 8.0 instance. Verify that tablespace files are encrypted by checking the filesystem. Encrypt an existing table and verify the data is accessible through normal queries. Time limit: 30 minutes.

2. Implement column-level encryption using pgcrypto in PostgreSQL. Create a table with a sensitive column, encrypt data on insert, and decrypt on select. Create a hash index for encrypted column lookups. Demonstrate the performance difference between encrypted and unencrypted column searches. Time limit: 45 minutes.

3. Set up TLS for PostgreSQL connections. Generate CA, server, and client certificates. Configure the server to require TLS. Connect from an application using the client certificate and verify the connection is encrypted using pg_stat_ssl. Time limit: 45 minutes.

4. Implement a complete encryption workflow: encrypt data with a key from HashiCorp Vault, store the encrypted data in PostgreSQL, retrieve and decrypt it. Demonstrate key rotation by rotating the Vault key and updating the encrypted data. Time limit: 60 minutes.

**Grading Criteria:**
- TDE configuration (20%): TDE is enabled correctly, encrypted tablespace verified
- Column encryption (25%): Data encrypted correctly, hash lookup works, performance documented
- TLS setup (25%): Certificates generated correctly, server requires TLS, connection verified as encrypted
- Key management (30%): Vault integration works, key rotation demonstrated, data remains accessible after rotation

**Evidence:**
- MySQL configuration with TDE settings
- pgcrypto encryption/decryption queries with output
- TLS certificate generation and connection verification
- Vault key management workflow with encryption/decryption results
