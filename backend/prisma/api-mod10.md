# Module 10 — API Gateway

An API gateway is a single entry point for all client requests. It sits between the client and your backend services, handling cross-cutting concerns like rate limiting, authentication, caching, logging, and request routing. Without a gateway, every backend service must implement these concerns independently, leading to duplication, inconsistency, and security gaps.

Think of the API gateway as the front desk of a hotel. Guests (clients) do not go directly to individual rooms (services). They go to the front desk, which handles check-in (authentication), key cards (authorization), billing (rate limiting), and directing guests to the right room (routing). The front desk also keeps a log of who entered which room and when (monitoring).

This module covers the core capabilities of an API gateway — rate limiting, caching, monitoring, request routing, and security enforcement — and walks through implementing a gateway for a real system.

## Why You Need a Gateway

Consider a flight training platform with these backend services:
- **Pilot service** — manages pilot profiles and certifications
- **Aircraft service** — manages the aircraft fleet
- **Training service** — manages training sessions and scheduling
- **Flight log service** — records completed flights
- **Billing service** — handles subscriptions and payments
- **Notification service** — sends emails and push notifications

Without a gateway, each client (web app, mobile app, third-party integration) must know the URL of each service and call them directly:

```
Web App → Pilot Service (pilot.example.com:3001)
Web App → Aircraft Service (aircraft.example.com:3002)
Web App → Training Service (training.example.com:3003)
Mobile App → Pilot Service (pilot.example.com:3001)
Mobile App → Training Service (training.example.com:3003)
Third Party → Pilot Service (pilot.example.com:3001)
```

This creates several problems:

**Client complexity.** Each client must know the URL of every service it needs. If a service moves, every client must be updated.

**Security inconsistency.** Each service implements its own authentication and authorization. If one service has a vulnerability, the attacker can exploit it directly.

**No centralized rate limiting.** A client can flood one service without affecting others. There is no global view of usage patterns.

**No unified logging.** Each service logs independently. Correlating logs across services requires manual effort.

**No caching.** Each service handles its own caching. There is no edge caching for frequently accessed data.

With a gateway:

```
Web App → API Gateway → Pilot Service
                       → Aircraft Service
                       → Training Service
Mobile App → API Gateway → Pilot Service
                         → Training Service
Third Party → API Gateway → Pilot Service
```

The client only knows the gateway URL. The gateway handles routing, authentication, rate limiting, caching, and logging. Backend services focus on business logic.

### When to Use a Gateway

**Use a gateway when:**
- You have more than 3 backend services
- Multiple client types consume your API (web, mobile, third-party)
- You need centralized authentication and rate limiting
- You want unified logging and monitoring
- You need to evolve services independently

**Skip the gateway when:**
- You have a single monolithic API
- The API is internal with a single client
- Performance is critical and the gateway adds unacceptable latency
- The team is small and the overhead is not justified

## Core Gateway Capabilities

### Request Routing

The gateway maps incoming URLs to backend services:

```yaml
# Gateway routing configuration
routes:
  - path: /api/v1/pilots/**
    service: pilot-service
    port: 3001
    strip_prefix: /api/v1/pilots
    target: /pilots
    
  - path: /api/v1/aircraft/**
    service: aircraft-service
    port: 3002
    strip_prefix: /api/v1/aircraft
    target: /aircraft
    
  - path: /api/v1/training-sessions/**
    service: training-service
    port: 3003
    strip_prefix: /api/v1/training-sessions
    target: /training-sessions
```

A request to `GET /api/v1/pilots/123` is routed to `http://pilot-service:3001/pilots/123`. The client never sees the internal service URL.

**Path-based routing** is the simplest approach. Different URL paths go to different services. It is easy to understand and debug.

**Host-based routing** uses the hostname to route requests. Different subdomains go to different services: `pilot.api.example.com` routes to the pilot service, `training.api.example.com` routes to the training service.

**Header-based routing** uses request headers for routing. This is useful for versioning: the `X-API-Version: v2` header routes to the v2 version of a service.

**Load balancing** distributes requests across multiple instances of a service. If the pilot service has 3 instances, the gateway round-robins requests across them. This provides horizontal scaling and fault tolerance.

### Rate Limiting

The gateway enforces rate limits centrally, preventing any single client from overwhelming a service:

```yaml
rate_limits:
  global:
    requests_per_minute: 1000
    requests_per_hour: 50000
    
  per_client:
    free:
      requests_per_minute: 100
      requests_per_hour: 10000
    pro:
      requests_per_minute: 1000
      requests_per_hour: 100000
    enterprise:
      requests_per_minute: 10000
      requests_per_hour: 1000000
      
  per_endpoint:
    /api/v1/aircraft:
      requests_per_minute: 50  # Expensive endpoint
    /api/v1/pilots:
      requests_per_minute: 200  # Cheap endpoint
```

The gateway tracks request counts using Redis:

```javascript
// Pseudocode for rate limiting in the gateway
async function checkRateLimit(clientId, endpoint) {
  const key = `ratelimit:${clientId}:${endpoint}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, 60); // 1-minute window
  }
  
  const limit = await getLimit(clientId, endpoint);
  
  if (current > limit) {
    return {
      allowed: false,
      limit: limit,
      remaining: 0,
      reset_at: await redis.ttl(key)
    };
  }
  
  return {
    allowed: true,
    limit: limit,
    remaining: limit - current,
    reset_at: await redis.ttl(key)
  };
}
```

### Caching

The gateway caches responses at the edge, reducing load on backend services and improving response times for clients:

```yaml
caching:
  rules:
    - path: /api/v1/pilots
      ttl: 60        # Cache for 60 seconds
      vary: [Authorization]  # Different cache per user
      
    - path: /api/v1/aircraft
      ttl: 300       # Cache for 5 minutes
      vary: []       # Same cache for all users (public data)
      
    - path: /api/v1/pilots/**
      ttl: 30        # Cache individual pilots for 30 seconds
      vary: [Authorization]
      
    - path: /api/v1/training-sessions/**
      ttl: 0         # Do not cache (real-time data)
```

The gateway checks the cache before forwarding the request to the backend:

```javascript
async function handleRequest(req, res) {
  const cacheKey = buildCacheKey(req);
  const cached = await cache.get(cacheKey);
  
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(cached.status).json(cached.body);
  }
  
  // Forward to backend
  const response = await forwardToBackend(req);
  
  // Cache if cacheable
  if (isCacheable(response)) {
    await cache.set(cacheKey, {
      status: response.status,
      body: response.body,
      headers: response.headers
    }, ttlForPath(req.path));
  }
  
  res.setHeader('X-Cache', 'MISS');
  return res.status(response.status).json(response.body);
}
```

Cache headers communicate caching behavior to clients:

```
X-Cache: HIT
Cache-Control: public, max-age=60
ETag: "abc123"
```

### Authentication and Authorization

The gateway validates tokens before forwarding requests to backend services:

```javascript
async function authenticate(req, res, next) {
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({
      error: 'missing_token',
      message: 'Authorization token is required'
    });
  }
  
  try {
    const decoded = await verifyToken(token);
    
    // Attach user info to request
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      scopes: decoded.scope,
      clientId: decoded.client_id
    };
    
    next();
  } catch (err) {
    return res.status(401).json({
      error: 'invalid_token',
      message: 'Token verification failed'
    });
  }
}
```

The gateway also enforces scope-based access:

```javascript
function requireScope(scope) {
  return (req, res, next) => {
    const tokenScopes = req.user.scopes.split(' ');
    
    if (!tokenScopes.includes(scope)) {
      return res.status(403).json({
        error: 'insufficient_scope',
        message: `Required scope: ${scope}`
      });
    }
    
    next();
  };
}

// Route configuration
routes: [
  {
    path: '/api/v1/pilots',
    service: 'pilot-service',
    middleware: ['authenticate', 'requireScope:pilot:read']
  },
  {
    path: '/api/v1/pilots',
    method: 'POST',
    service: 'pilot-service',
    middleware: ['authenticate', 'requireScope:pilot:write']
  }
]
```

### Gateway Authentication Patterns

**JWT validation.** The gateway validates JWT tokens and extracts user information:

```javascript
async function validateJWT(token) {
  try {
    const decoded = await jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://auth.example.com',
      audience: 'https://api.example.com'
    });
    
    return {
      id: decoded.sub,
      role: decoded.role,
      scopes: decoded.scope,
      schoolId: decoded.school_id
    };
  } catch (err) {
    throw new AppError(401, 'invalid_token', 'Token verification failed');
  }
}
```

**API key validation.** The gateway validates API keys for machine-to-machine communication:

```javascript
async function validateAPIKey(apiKey) {
  const key = await redis.get(`apikey:${apiKey}`);
  
  if (!key) {
    throw new AppError(401, 'invalid_api_key', 'Invalid API key');
  }
  
  return {
    id: key.client_id,
    scopes: key.scopes,
    rateLimit: key.rate_limit
  };
}
```

**OAuth 2.0 token exchange.** The gateway can exchange authorization codes for tokens:

```javascript
async function exchangeCode(code, redirectUri) {
  const response = await fetch('https://auth.example.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET
    })
  });
  
  return response.json();
}
```

### Request Transformation

The gateway can modify requests before forwarding them:

```javascript
// Add headers
req.headers['X-Forwarded-For'] = req.ip;
req.headers['X-Request-ID'] = generateRequestId();
req.headers['X-User-ID'] = req.user.id;

// Transform request body
if (req.body.school_id === undefined && req.user.schoolId) {
  req.body.school_id = req.user.schoolId;
}

// Rewrite URL
req.url = req.url.replace('/api/v1/pilots', '/pilots');
```

**Common request transformations:**
- Add request ID for tracing
- Add user ID from authenticated token
- Inject default values (e.g., school_id from user context)
- Rewrite URLs for backward compatibility
- Remove sensitive fields from request body

### Response Transformation

The gateway can modify responses before returning them to the client:

```javascript
// Remove sensitive headers from backend response
delete response.headers['x-internal-debug'];

// Add standard headers
response.headers['X-API-Version'] = 'v2';
response.headers['X-Request-ID'] = req.requestId;

// Transform response body
const body = response.body;
if (body.password_hash) {
  delete body.password_hash;
}
```

**Common response transformations:**
- Remove internal headers (Server, X-Powered-By)
- Add standard headers (X-Request-ID, X-API-Version)
- Remove sensitive fields (password_hash, internal_notes)
- Flatten nested responses for simpler clients
- Add HATEOAS links for API discoverability

## Monitoring and Observability

The gateway is the single point where all traffic flows. This makes it the ideal location for monitoring and observability.

### Metrics

Track these metrics at the gateway:

**Request metrics:**
- Total requests per second
- Requests per endpoint
- Requests per client
- Requests per status code (2xx, 3xx, 4xx, 5xx)

**Latency metrics:**
- Gateway processing time
- Backend response time
- Total client-perceived latency

**Error metrics:**
- Error rate per endpoint
- Error rate per client
- Error rate per backend service

**Rate limit metrics:**
- Rate limit violations per client
- Rate limit violations per endpoint

**Cache metrics:**
- Cache hit ratio
- Cache miss ratio
- Cache evictions
- Cache size

**Connection metrics:**
- Active connections per backend
- Connection pool utilization
- Connection wait time

### Logging

The gateway logs every request with consistent fields:

```json
{
  "timestamp": "2026-08-30T14:30:00Z",
  "request_id": "req_abc123",
  "method": "GET",
  "path": "/api/v1/pilots/123",
  "client_ip": "192.168.1.100",
  "user_id": "pilot_456",
  "client_id": "training_app",
  "status": 200,
  "duration_ms": 45,
  "backend": "pilot-service",
  "backend_duration_ms": 30,
  "cache_hit": true,
  "rate_limit_remaining": 87
}
```

### Log Aggregation

Centralize logs from all gateway instances:

```
Gateway Instance 1 ─┐
Gateway Instance 2 ─┼─→ Logstash ─→ Elasticsearch ─→ Kibana
Gateway Instance 3 ─┘
```

Or use a cloud-based solution:

```
Gateway → CloudWatch Logs → CloudWatch Insights
Gateway → Datadog → Log Explorer
Gateway → Splunk → Search & Reporting
```

### Distributed Tracing

When a request passes through multiple services, distributed tracing tracks the request across all of them. The gateway generates a trace ID and passes it to each backend service:

```
Client → Gateway (trace_id: abc123)
       → Pilot Service (trace_id: abc123, span_id: span_1)
       → Certification Service (trace_id: abc123, span_id: span_2)
```

Each service records its processing time and passes the trace ID to the next service. The gateway collects the complete trace and logs it:

```json
{
  "trace_id": "abc123",
  "spans": [
    { "service": "gateway", "duration_ms": 15 },
    { "service": "pilot-service", "duration_ms": 30 },
    { "service": "certification-service", "duration_ms": 20 }
  ],
  "total_duration_ms": 65
}
```

### Alerting

Set up alerts for gateway metrics:

- **Error rate spike** — Alert if the 5xx error rate exceeds 5% for 5 minutes
- **Latency degradation** — Alert if p95 latency exceeds 1 second for 5 minutes
- **Rate limit abuse** — Alert if a single client exceeds rate limits more than 10 times per minute
- **Backend failure** — Alert if a backend service returns more than 50% errors
- **Certificate expiry** — Alert if TLS certificates expire within 30 days

## Security Features

### TLS Termination

The gateway handles TLS termination, decrypting HTTPS requests and forwarding plain HTTP to backend services:

```yaml
tls:
  enabled: true
  certificate: /etc/ssl/certs/api.example.com.pem
  key: /etc/ssl/private/api.example.com.key
  min_version: TLSv1.2
  ciphers:
    - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
    - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
```

This means backend services do not need to handle TLS. The gateway handles it once, reducing the attack surface and simplifying certificate management.

### IP Allowlisting and Blocklisting

The gateway can block requests from specific IP addresses or ranges:

```yaml
ip_rules:
  allow:
    - 10.0.0.0/8       # Internal network
    - 192.168.1.0/24    # Office network
  block:
    - 203.0.113.0/24    # Known bad range
```

### Request Size Limits

The gateway rejects oversized requests before they reach backend services:

```yaml
limits:
  max_request_size: 10MB
  max_header_size: 8KB
  max_url_length: 2048
```

### CORS Handling

The gateway handles Cross-Origin Resource Sharing (CORS) centrally:

```yaml
cors:
  allowed_origins:
    - https://app.example.com
    - https://admin.example.com
  allowed_methods:
    - GET
    - POST
    - PUT
    - PATCH
    - DELETE
  allowed_headers:
    - Authorization
    - Content-Type
    - X-API-Key
  max_age: 86400
```

### DDoS Protection

The gateway provides basic DDoS protection through:

- **Rate limiting** — Limits the number of requests per client
- **Connection limiting** — Limits the number of concurrent connections per IP
- **Request size limits** — Rejects oversized requests
- **IP blocklisting** — Blocks known malicious IPs
- **Geographic filtering** — Blocks requests from unexpected regions

### Security Headers

The gateway adds security headers to all responses:

```yaml
# Security headers configuration
plugins:
  - name: response-transformer
    config:
      add_headers:
        # Prevent clickjacking
        X-Frame-Options: DENY
        # Prevent MIME type sniffing
        X-Content-Type-Options: nosniff
        # Enable XSS protection
        X-XSS-Protection: "1; mode=block"
        # Strict transport security
        Strict-Transport-Security: "max-age=31536000; includeSubDomains"
        # Content security policy
        Content-Security-Policy: "default-src 'self'"
        # Referrer policy
        Referrer-Policy: strict-origin-when-cross-origin
        # Permissions policy
        Permissions-Policy: "camera=(), microphone=(), geolocation=()"
```

### API Key Validation

The gateway can validate API keys before forwarding requests:

```yaml
plugins:
  - name: key-auth
    config:
      key_names:
        - apikey
        - X-API-Key
      key_in_query: false
      key_in_header: true
      hide_credentials: true
```

### IP Restriction

Restrict access to specific IP addresses:

```yaml
plugins:
  - name: ip-restriction
    config:
      allow:
        - 10.0.0.0/8        # Internal network
        - 192.168.1.0/24    # Office network
        - 203.0.113.50      # Specific partner IP
      deny:
        - 198.51.100.0/24   # Blocked range
      status: 403
      message: "Access denied"
```

## Implementation Options

### Managed Gateways

**AWS API Gateway** — Fully managed service with built-in rate limiting, caching, authentication, and monitoring. Integrates with Lambda, EC2, and other AWS services.

**Kong Gateway** — Open-source gateway with a plugin architecture. Runs on NGINX and provides rate limiting, authentication, logging, and transformation plugins.

**Tyk** — Open-source gateway with a dashboard for configuration. Supports rate limiting, authentication, analytics, and developer portal.

**Apigee** — Google's API management platform. Provides rate limiting, caching, security, and analytics.

### Self-Hosted Gateways

**NGINX** — High-performance reverse proxy with rate limiting, caching, and load balancing. Requires Lua scripting for advanced features.

**Traefik** — Cloud-native reverse proxy with automatic service discovery. Integrates with Docker, Kubernetes, and Consul.

**Envoy** — High-performance L4/L7 proxy designed for cloud-native applications. Provides observability, rate limiting, and load balancing.

### Gateway Comparison

| Feature | Kong | AWS API Gateway | NGINX | Traefik |
|---------|------|-----------------|-------|---------|
| Rate Limiting | Plugin | Built-in | Lua module | Plugin |
| Authentication | Plugin | Built-in | Lua module | Plugin |
| Caching | Plugin | Built-in | Built-in | Plugin |
| Monitoring | Plugin | CloudWatch | Custom | Prometheus |
| Service Discovery | DNS | AWS | DNS | Docker/K8s |
| Configuration | YAML/DB | Console/Terraform | Config file | TOML/YAML |
| Cost | Free/Enterprise | Pay per request | Free | Free/Enterprise |

### Gateway as Code

Modern gateways support configuration as code:

```yaml
# Kong gateway configuration
services:
  - name: pilot-service
    url: http://pilot-service:3001
    routes:
      - name: pilot-routes
        paths:
          - /api/v1/pilots
        methods:
          - GET
          - POST
          - PUT
          - PATCH
          - DELETE
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          policy: redis
      - name: jwt
        config:
          claims_to_verify:
            - exp
      - name: cors
        config:
          origins:
            - https://app.example.com

  - name: aircraft-service
    url: http://aircraft-service:3002
    routes:
      - name: aircraft-routes
        paths:
          - /api/v1/aircraft
    plugins:
      - name: rate-limiting
        config:
          minute: 50
          policy: redis
```

## Gateway Patterns

### Service Discovery

The gateway discovers backend services automatically:

```yaml
# Kubernetes service discovery
services:
  - name: pilot-service
    url: http://pilot-service.default.svc.cluster.local:3001
    discovery_type: dns
    discovery_config:
      dns_domain: default.svc.cluster.local
      port: 3001
```

### Load Balancing

Distribute traffic across multiple instances:

```yaml
services:
  - name: pilot-service
    url: http://pilot-service:3001
    load_balancer:
      type: round-robin  # Options: round-robin, least-connections, random
      healthchecks:
        active:
          http_path: /health
          healthy:
            interval: 5
            successes: 3
          unhealthy:
            interval: 5
            http_failures: 3
            tcp_failures: 3
            timeouts: 3
```

### Circuit Breaking

Protect backend services from cascading failures:

```yaml
services:
  - name: pilot-service
    url: http://pilot-service:3001
    plugins:
      - name: circuit-breaker
        config:
          threshold: 5          # Failures before opening
          timeout: 30           # Seconds before half-open
          volume: 10            # Requests in sliding window
          trip_interval: 60     # Seconds between trip checks
```

### Request/Response Transformation

Transform requests and responses at the gateway:

```yaml
services:
  - name: pilot-service
    url: http://pilot-service:3001
    plugins:
      - name: request-transformer
        config:
          add_headers:
            X-Request-ID: $(uuid)
            X-Forwarded-For: $(remote_addr)
          remove_headers:
            - X-Internal-Debug
          
      - name: response-transformer
        config:
          add_headers:
            X-API-Version: v1
            X-Gateway: kong
          remove_headers:
            - X-Internal-Debug
            - Server
```

### Retry Logic

Configure automatic retries for failed requests:

```yaml
services:
  - name: pilot-service
    url: http://pilot-service:3001
    retries: 3
    retry_timeout: 5000  # 5 seconds
    retry_on:
      - 502
      - 503
      - 504
```

## Real Scenario: Implementing a Gateway for a Flight Training Platform

Consider the flight training platform with 6 backend services. Here is how you implement a gateway.

### Architecture

```
                    ┌─────────────────┐
                    │   API Gateway    │
                    │  (Kong on NGINX) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────┴──────┐ ┌────┴───────┐ ┌────┴──────────┐
    │  Pilot Service  │ │ Aircraft   │ │ Training      │
    │  (Node.js)      │ │ Service    │ │ Service       │
    └────────────────┘ │ (Node.js)  │ │ (Node.js)     │
                       └────────────┘ └───────────────┘
```

### Routing Configuration

```yaml
services:
  - name: pilot-service
    url: http://pilot-service:3001
    routes:
      - paths: ["/api/v1/pilots"]
        strip_prefix: true
    plugins:
      - name: rate-limiting
        config: { minute: 200, policy: redis }
      - name: jwt
      - name: request-transformer
        config:
          add_headers: ["X-Service: pilot"]

  - name: aircraft-service
    url: http://aircraft-service:3002
    routes:
      - paths: ["/api/v1/aircraft"]
        strip_prefix: true
    plugins:
      - name: rate-limiting
        config: { minute: 100, policy: redis }
      - name: jwt
      - name: proxy-cache
        config:
          response_code: [200]
          request_method: [GET]
          content_type: ["application/json"]
          cache_ttl: 300

  - name: training-service
    url: http://training-service:3003
    routes:
      - paths: ["/api/v1/training-sessions"]
        strip_prefix: true
    plugins:
      - name: rate-limiting
        config: { minute: 150, policy: redis }
      - name: jwt
```

### Rate Limiting Tiers

```yaml
plugins:
  - name: rate-limiting
    config:
      minute: 100
      hour: 5000
      policy: redis
      fault_tolerant: true
      hide_client_headers: false
    consumer_group: free
  - name: rate-limiting
    config:
      minute: 1000
      hour: 50000
      policy: redis
    consumer_group: pro
  - name: rate-limiting
    config:
      minute: 10000
      hour: 500000
      policy: redis
    consumer_group: enterprise
```

### Gateway Migration

When migrating to a gateway, follow a phased approach:

**Phase 1: Deploy gateway as reverse proxy.** The gateway forwards all requests to the existing API without modification. This allows you to test the gateway infrastructure without changing any behavior.

**Phase 2: Add rate limiting and authentication.** Enable rate limiting at the gateway level and move authentication from the API to the gateway. This centralizes security concerns.

**Phase 3: Add caching and monitoring.** Enable caching at the gateway for frequently accessed data. Set up monitoring dashboards and alerting.

**Phase 4: Split into microservices.** Gradually split the monolithic API into separate services behind the gateway. The gateway routes requests to the appropriate service based on the URL path.

**Phase 5: Optimize.** Fine-tune rate limits, cache TTLs, and routing rules based on production traffic patterns.

### Monitoring Dashboard

The gateway feeds metrics to a monitoring stack:

```
Gateway → Prometheus → Grafana Dashboard
Gateway → ELK Stack → Log Analysis
Gateway → Jaeger → Distributed Tracing
```

The Grafana dashboard shows:
- Requests per second by endpoint and client
- Response time percentiles (p50, p95, p99)
- Error rates by status code
- Rate limit violations by client
- Cache hit/miss ratio
- Backend service health

### Security Audit

The gateway logs every request with full context:

```json
{
  "timestamp": "2026-08-30T14:30:00Z",
  "request_id": "req_abc123def456",
  "client_ip": "203.0.113.50",
  "method": "POST",
  "path": "/api/v1/pilots",
  "user_id": "instructor_789",
  "client_id": "training_app_abc",
  "status": 201,
  "duration_ms": 120,
  "rate_limit_remaining": 87,
  "cache_hit": false
}
```

This log answers security questions: "Who created a pilot record at 2:30 PM?" "Which client exceeded the rate limit?" "What requests came from IP 203.0.113.50?"

### Gateway Security Checklist

Before deploying a gateway to production, verify:

- [ ] TLS 1.2+ enforced, weak ciphers disabled
- [ ] Rate limiting enabled for all public endpoints
- [ ] Authentication middleware applied to all protected routes
- [ ] CORS configured with specific allowed origins (not wildcards)
- [ ] Request size limits set (max body, max headers, max URL length)
- [ ] Error responses do not leak internal details
- [ ] Logging captures request ID, user ID, and client IP
- [ ] Health check endpoint available for load balancers
- [ ] Backend services not directly accessible from the internet
- [ ] API keys and tokens rotated regularly

## Assessment

**Lab 1: Gateway Design** (40 minutes)

Design an API gateway configuration for a platform with 8 backend services. Include routing rules for each service, rate limiting tiers for 4 client types, caching rules for 3 data categories (public, private, real-time), and authentication middleware. Write the configuration in YAML.

Grading: 30 points. 10 points for routing, 10 points for rate limiting, 5 points for caching, 5 points for authentication.

**Lab 2: Monitoring Setup** (35 minutes)

Design a monitoring and alerting strategy for an API gateway. Specify: 10 metrics to track, 5 alert rules with thresholds, the dashboard layout (what panels and their placement), and the log format for every request. Include example alerts with severity levels.

Grading: 25 points. 5 points for metrics, 10 points for alerts, 5 points for dashboard, 5 points for logs.

**Lab 3: Security Configuration** (30 minutes)

Configure security features for an API gateway: TLS termination, IP allowlisting/blocklisting, CORS, request size limits, and DDoS protection. Specify the configuration for each feature and explain the security benefit.

Grading: 25 points. 5 points per correctly configured feature.

## Evidence

- API Gateway patterns: Sam Newman, "Building Microservices" (O'Reilly)
- Kong documentation: docs.konghq.com
- NGINX as API gateway: docs.nginx.com
- AWS API Gateway: docs.aws.amazon.com/apigateway
- Rate limiting algorithms: IETF draft-ietf-httpapi-ratelimit-headers
- Distributed tracing: OpenTelemetry specification (opentelemetry.io)
