# Module 8 — GraphQL Security

GraphQL APIs are powerful but introduce security risks that REST APIs do not have. The flexible query language means clients can request deeply nested data, which can exhaust server resources. The single endpoint model means rate limiting and authentication work differently. The introspection system can expose your entire schema to attackers.

This module covers GraphQL-specific security risks — query depth attacks, introspection abuse, N+1 query problems, batching attacks, and how to secure a GraphQL API for production use.

## The GraphQL Attack Surface

GraphQL APIs expose a single endpoint (usually `/graphql`) that accepts queries, mutations, and subscriptions. The server executes whatever query the client sends, which creates unique security challenges.

### Query Complexity Attacks

A client can send a deeply nested query that forces the server to traverse large portions of the database:

```graphql
query {
  pilots {
    trainingSessions {
      aircraft {
        maintenanceRecords {
          parts {
            supplier {
              contracts {
                terms
              }
            }
          }
        }
      }
    }
  }
}
```

This query traverses 7 levels of relationships. If each pilot has 10 training sessions, each session references 1 aircraft, each aircraft has 5 maintenance records, each record involves 3 parts, and each part has 1 supplier with 2 contracts, the server must execute:

1 × 10 × 1 × 5 × 3 × 1 × 2 = 300 database queries

An attacker can send thousands of these queries per second, exhausting database connections and CPU.

### Introspection Attacks

GraphQL APIs often enable introspection, which allows clients to query the entire schema:

```graphql
{
  __schema {
    types {
      name
      fields {
        name
        type {
          name
        }
      }
    }
  }
}
```

This returns the complete API schema — every type, every field, every relationship. An attacker can use this information to:

- Discover sensitive fields (e.g., `password_hash`, `ssn`, `internal_notes`)
- Map the database structure
- Find admin-only mutations
- Identify deprecated or internal fields

### N+1 Query Problem

When resolving a list of items, GraphQL can trigger N+1 database queries:

```graphql
query {
  pilots {
    id
    name
    email
  }
}
```

If the resolver fetches all pilots in one query (the "1"), then fetches each pilot's email in a separate query (the "N"), you have an N+1 problem. With 1,000 pilots, this becomes 1,001 queries.

### Batching Attacks

GraphQL allows batching multiple operations in a single request:

```json
[
  { "query": "mutation { login(email: \"a\", password: \"b\") { token } }" },
  { "query": "mutation { login(email: \"c\", password: \"d\") { token } }" },
  { "query": "mutation { login(email: "e", password: \"f\") { token } }" }
]
```

This allows an attacker to attempt thousands of login attempts in a single HTTP request, bypassing per-request rate limiting.

### Subscription Abuse

GraphQL subscriptions maintain persistent connections. An attacker can open many subscriptions, exhausting server resources:

```graphql
subscription {
  onPilotUpdated {
    id
    name
    email
  }
}
```

Each subscription holds a database connection and server memory. An attacker opening 10,000 subscriptions can exhaust the connection pool and crash the server.

## Securing GraphQL APIs

### Disable Introspection in Production

The most important first step. Disable introspection in production:

```javascript
const { ApolloServer } = require('@apollo/server');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production'
});
```

In Express with graphql-http:

```javascript
const { createHandler } = require('graphql-http/lib/use/express');

app.all('/graphql', createHandler({
  schema: schema,
  introspection: false
}));
```

### Query Depth Limiting

Reject queries that exceed a maximum depth:

```javascript
function depthLimit(maxDepth) {
  return (req, res, next) => {
    const query = req.body.query;
    if (!query) return next();
    
    const depth = getDepth(query);
    
    if (depth > maxDepth) {
      return res.status(400).json({
        error: 'query_too_deep',
        message: `Query depth ${depth} exceeds maximum allowed depth of ${maxDepth}`
      });
    }
    
    next();
  };
}

function getDepth(query) {
  let depth = 0;
  let maxDepth = 0;
  
  for (let i = 0; i < query.length; i++) {
    if (query[i] === '{') {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
    } else if (query[i] === '}') {
      depth--;
    }
  }
  
  return maxDepth;
}

app.use('/graphql', depthLimit(10));
```

### Query Complexity Analysis

Assign a cost to each field and reject queries that exceed a complexity budget:

```javascript
function calculateComplexity(query, schema, maxComplexity = 1000) {
  const complexity = analyzeQuery(query, schema);
  
  if (complexity > maxComplexity) {
    throw new Error(`Query complexity ${complexity} exceeds maximum ${maxComplexity}`);
  }
  
  return complexity;
}

function analyzeQuery(query, schema) {
  let totalComplexity = 0;
  
  // Analyze each field
  const fields = extractFields(query);
  for (const field of fields) {
    const fieldDef = schema.getField(field.name);
    const fieldComplexity = fieldDef.complexity || 1;
    const childComplexity = field.children ? analyzeQuery(field.children, schema) : 0;
    
    totalComplexity += fieldComplexity + childComplexity;
  }
  
  return totalComplexity;
}

// Schema definition with complexity costs
const typeDefs = `
  type Pilot {
    id: ID!
    name: String!
    email: String!
    trainingSessions: [TrainingSession!]! @complexity(value: 5)
    flightLogs: [FlightLog!]! @complexity(value: 3)
  }
  
  type TrainingSession {
    id: ID!
    date: String!
    aircraft: Aircraft! @complexity(value: 2)
    instructor: Pilot! @complexity(value: 2)
  }
`;
```

### Rate Limiting for GraphQL

Rate limit GraphQL differently than REST. Count by query complexity, not by request count:

```javascript
function graphqlRateLimit(options) {
  const { windowMs, maxComplexity, maxRequests } = options;
  const clients = new Map();
  
  return (req, res, next) => {
    const clientId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get client's request history
    const clientHistory = clients.get(clientId) || [];
    const recentRequests = clientHistory.filter(r => r.time > windowStart);
    
    // Calculate total complexity in window
    const totalComplexity = recentRequests.reduce((sum, r) => sum + r.complexity, 0);
    const queryComplexity = calculateComplexity(req.body.query);
    
    // Check limits
    if (totalComplexity + queryComplexity > maxComplexity) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message: 'Query complexity limit exceeded',
        retry_after: Math.ceil((recentRequests[0].time + windowMs - now) / 1000)
      });
    }
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        message: 'Request limit exceeded',
        retry_after: Math.ceil((recentRequests[0].time + windowMs - now) / 1000)
      });
    }
    
    // Record this request
    recentRequests.push({ time: now, complexity: queryComplexity });
    clients.set(clientId, recentRequests);
    
    // Set rate limit headers
    res.setHeader('X-Rate-Limit-Complexity', maxComplexity);
    res.setHeader('X-Rate-Limit-Remaining', maxComplexity - totalComplexity - queryComplexity);
    
    next();
  };
}

app.use('/graphql', graphqlRateLimit({
  windowMs: 60000,
  maxComplexity: 10000,
  maxRequests: 100
}));
```

### Persisted Queries

Only allow pre-approved queries. Clients send a query ID instead of the full query text:

```javascript
const persistedQueries = new Map([
  ['abc123', 'query { pilots { id name email } }'],
  ['def456', 'mutation { createPilot(input: $input) { id } }']
]);

function persistedQueryMiddleware(req, res, next) {
  if (req.body.id) {
    const query = persistedQueries.get(req.body.id);
    
    if (!query) {
      return res.status(400).json({
        error: 'persisted_query_not_found',
        message: `No query found for ID: ${req.body.id}`
      });
    }
    
    req.body.query = query;
  }
  
  next();
}

app.use('/graphql', persistedQueryMiddleware);
```

### Authorization Per Field

GraphQL does not have endpoint-level authorization. You need field-level authorization:

```javascript
const resolvers = {
  Query: {
    pilots: async (parent, args, context) => {
      // Check authorization
      if (!context.user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      if (!context.user.scopes.includes('pilot:read')) {
        throw new ForbiddenError('Insufficient permissions');
      }
      
      return db.pilots.findMany();
    }
  },
  
  Pilot: {
    email: async (parent, args, context) => {
      // Only the pilot themselves or admins can see email
      if (context.user.id !== parent.id && context.user.role !== 'admin') {
        return null; // Redact email
      }
      return parent.email;
    },
    
    trainingSessions: async (parent, args, context) => {
      // Instructors can see their students' sessions
      if (context.user.role === 'instructor' && 
          context.user.schoolId === parent.schoolId) {
        return db.trainingSessions.findMany({ where: { student_id: parent.id } });
      }
      
      // Pilots can only see their own sessions
      if (context.user.id === parent.id) {
        return db.trainingSessions.findMany({ where: { student_id: parent.id } });
      }
      
      return []; // No access
    }
  }
};
```

### Input Validation

Validate all mutation inputs:

```javascript
const { z } = require('zod');

const createPilotSchema = z.object({
  email: z.string().email().max(255),
  first_name: z.string().min(1).max(100).trim(),
  last_name: z.string().min(1).max(100).trim(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

const resolvers = {
  Mutation: {
    createPilot: async (parent, { input }, context) => {
      // Validate input
      const validated = createPilotSchema.parse(input);
      
      // Create pilot
      return db.pilots.create({ data: validated });
    }
  }
};
```

## Preventing N+1 Queries

The N+1 problem is one of the most common GraphQL performance issues. Use DataLoader to batch and cache database queries:

```javascript
const DataLoader = require('dataloader');

// Create a DataLoader for fetching pilots by ID
function createPilotLoader() {
  return new DataLoader(async (ids) => {
    const pilots = await db.pilots.findMany({
      where: { id: { in: ids } }
    });
    
    // Return pilots in the same order as the IDs
    return ids.map(id => pilots.find(p => p.id === id));
  });
}

// Create a DataLoader for fetching training sessions by pilot ID
function createTrainingSessionLoader() {
  return new DataLoader(async (pilotIds) => {
    const sessions = await db.trainingSessions.findMany({
      where: { student_id: { in: pilotIds } }
    });
    
    // Group sessions by pilot ID
    return pilotIds.map(id => 
      sessions.filter(s => s.student_id === id)
    );
  });
}

// Context factory creates fresh DataLoaders per request
function createContext(req) {
  return {
    user: req.user,
    loaders: {
      pilot: createPilotLoader(),
      trainingSessions: createTrainingSessionLoader()
    }
  };
}

// Resolvers use DataLoaders
const resolvers = {
  Query: {
    pilots: async (parent, args, context) => {
      return db.pilots.findMany();
    }
  },
  
  Pilot: {
    trainingSessions: async (parent, args, context) => {
      // Uses DataLoader instead of direct DB query
      return context.loaders.trainingSessions.load(parent.id);
    }
  }
};
```

With DataLoader, the query:

```graphql
query {
  pilots {
    id
    name
    trainingSessions {
      id
      date
    }
  }
}
```

Executes 2 queries instead of 1 + N:

```
1. SELECT * FROM pilots
2. SELECT * FROM training_sessions WHERE student_id IN (id1, id2, id3, ...)
```

## Subscription Security

### Authentication

Require authentication for subscriptions:

```javascript
const { SubscriptionServer } = require('graphql-ws/lib/use/ws');

const subscriptionServer = SubscriptionServer.create({
  schema,
  execute,
  subscribe,
  onConnect: async (connectionParams) => {
    const token = connectionParams.authorization?.split(' ')[1];
    
    if (!token) {
      throw new Error('Authentication required');
    }
    
    try {
      const user = verifyToken(token);
      return { user };
    } catch (err) {
      throw new Error('Invalid token');
    }
  }
});
```

### Rate Limiting Subscriptions

Limit the number of concurrent subscriptions per client:

```javascript
const subscriptionCounts = new Map();

function limitSubscriptions(maxPerClient) {
  return {
    onConnect: async (connectionParams, socket) => {
      const clientId = socket.user?.id || socket.ip;
      const current = subscriptionCounts.get(clientId) || 0;
      
      if (current >= maxPerClient) {
        throw new Error('Too many subscriptions');
      }
      
      subscriptionCounts.set(clientId, current + 1);
      
      return { user: socket.user };
    },
    
    onDisconnect: async (socket) => {
      const clientId = socket.user?.id || socket.ip;
      const current = subscriptionCounts.get(clientId) || 0;
      subscriptionCounts.set(clientId, Math.max(0, current - 1));
    }
  };
}
```

### Subscription Filtering

Only send events that the subscriber is authorized to receive:

```javascript
const resolvers = {
  Subscription: {
    onPilotUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('PILOT_UPDATED'),
        (payload, variables, context) => {
          // Only send updates for pilots at the same school
          return payload.onPilotUpdated.schoolId === context.user.schoolId;
        }
      )
    }
  }
};
```

## Query Complexity Budget

Implement a complexity budget system that rejects queries before execution:

```javascript
const complexityRules = {
  // Default cost for fields
  defaultFieldCost: 1,
  
  // Cost for list fields (multiply by estimated list size)
  listFieldCost: 10,
  
  // Cost for connection fields (relay-style pagination)
  connectionCost: 15,
  
  // Maximum allowed complexity
  maxComplexity: 1000,
  
  // Cost multipliers for arguments
  argumentCosts: {
    first: (value) => Math.min(value / 10, 10), // Higher cost for larger pages
    last: (value) => Math.min(value / 10, 10),
    limit: (value) => Math.min(value / 10, 10)
  }
};

function estimateComplexity(query, variables = {}) {
  const document = parse(query);
  let complexity = 0;
  
  visit(document, {
    Field(node) {
      const fieldName = node.name.value;
      const fieldCost = getFieldCost(fieldName);
      
      // Check for list fields
      if (isListField(fieldName)) {
        const listSize = getListSize(node, variables);
        complexity += fieldCost * listSize;
      } else {
        complexity += fieldCost;
      }
    },
    
    OperationDefinition(node) {
      // Add base cost for operation type
      if (node.operation === 'mutation') {
        complexity += 10; // Mutations are more expensive
      } else if (node.operation === 'subscription') {
        complexity += 5;
      }
    }
  });
  
  return complexity;
}
```

### Persisted Queries in Practice

Persisted queries eliminate the ability to send arbitrary queries. Clients send a query hash instead of the full query text:

```javascript
const crypto = require('crypto');

// Server-side query registry
const queryRegistry = new Map();

function registerQuery(query, operationName) {
  const hash = crypto.createHash('sha256').update(query).digest('hex');
  queryRegistry.set(hash, { query, operationName });
  return hash;
}

// Register known queries at startup
const pilotsQuery = `
  query GetPilots($limit: Int, $offset: Int) {
    pilots(limit: $limit, offset: $offset) {
      id
      first_name
      last_name
      email
    }
  }
`;
const pilotsHash = registerQuery(pilotsQuery, 'GetPilots');

// Middleware to resolve persisted queries
function persistedQueryMiddleware(req, res, next) {
  if (req.body.extensions?.persistedQuery) {
    const { sha256Hash } = req.body.extensions.persistedQuery;
    
    const registered = queryRegistry.get(sha256Hash);
    if (!registered) {
      return res.status(400).json({
        errors: [{ message: 'Persisted query not found' }]
      });
    }
    
    req.body.query = registered.query;
    req.body.operationName = registered.operationName;
  }
  
  next();
}
```

### Query Whitelisting

For maximum security, only allow pre-approved queries:

```javascript
const allowedQueries = new Set([
  'GetPilotById',
  'ListPilots',
  'CreateTrainingSession',
  'GradeTrainingSession'
]);

function queryWhitelistMiddleware(req, res, next) {
  if (req.body.operationName && !allowedQueries.has(req.body.operationName)) {
    return res.status(403).json({
      errors: [{ message: `Operation '${req.body.operationName}' is not allowed` }]
    });
  }
  
  next();
}
```

## GraphQL Security Patterns

### Field-Level Rate Limiting

Different fields have different costs. Rate limit based on the fields accessed:

```javascript
const fieldCosts = {
  pilots: 1,
  trainingSessions: 2,
  aircraft: 1,
  flightLogs: 3,  // Expensive query
  analytics: 5    // Very expensive query
};

function calculateQueryCost(query) {
  const document = parse(query);
  let totalCost = 0;
  
  visit(document, {
    Field(node) {
      const fieldName = node.name.value;
      totalCost += fieldCosts[fieldName] || 1;
    }
  });
  
  return totalCost;
}

function fieldBasedRateLimit(maxCostPerMinute) {
  const costs = new Map();
  
  return (req, res, next) => {
    if (!req.body.query) return next();
    
    const clientId = req.user?.id || req.ip;
    const queryCost = calculateQueryCost(req.body.query);
    const now = Date.now();
    const windowStart = now - 60000;
    
    const clientCosts = costs.get(clientId) || [];
    const recentCosts = clientCosts.filter(c => c.time > windowStart);
    const totalCost = recentCosts.reduce((sum, c) => sum + c.cost, 0);
    
    if (totalCost + queryCost > maxCostPerMinute) {
      return res.status(429).json({
        errors: [{
          message: 'Query cost limit exceeded',
          extensions: {
            code: 'QUERY_COST_LIMIT_EXCEEDED',
            cost: queryCost,
            remaining: Math.max(0, maxCostPerMinute - totalCost)
          }
        }]
      });
    }
    
    recentCosts.push({ time: now, cost: queryCost });
    costs.set(clientId, recentCosts);
    
    res.setHeader('X-Query-Cost-Limit', maxCostPerMinute);
    res.setHeader('X-Query-Cost-Remaining', maxCostPerMinute - totalCost - queryCost);
    
    next();
  };
}
```

### Query Depth Analysis

Analyze and limit query depth to prevent deeply nested queries:

```javascript
function analyzeQueryDepth(query) {
  const document = parse(query);
  let maxDepth = 0;
  let currentDepth = 0;
  
  visit(document, {
    enter(node) {
      if (node.kind === 'Field' || node.kind === 'SelectionSet') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }
    },
    leave(node) {
      if (node.kind === 'Field' || node.kind === 'SelectionSet') {
        currentDepth--;
      }
    }
  });
  
  return maxDepth;
}

function depthLimitMiddleware(maxDepth) {
  return (req, res, next) => {
    if (!req.body.query) return next();
    
    const depth = analyzeQueryDepth(req.body.query);
    
    if (depth > maxDepth) {
      return res.status(400).json({
        errors: [{
          message: `Query depth ${depth} exceeds maximum allowed depth of ${maxDepth}`,
          extensions: {
            code: 'QUERY_DEPTH_EXCEEDED',
            depth: depth,
            maxDepth: maxDepth
          }
        }]
      });
    }
    
    res.setHeader('X-Query-Depth', depth);
    res.setHeader('X-Query-Depth-Limit', maxDepth);
    
    next();
  };
}
```

### Resource Usage Tracking

Track resource usage per query for billing and monitoring:

```javascript
function resourceTrackingMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const memoryUsed = process.memoryUsage().heapUsed - startMemory;
      
      logger.info({
        event: 'graphql_query',
        query: req.body.query?.substring(0, 100),
        operationName: req.body.operationName,
        duration_ms: duration,
        memory_bytes: memoryUsed,
        user_id: req.user?.id,
        complexity: req.queryComplexity,
        depth: req.queryDepth
      });
    });
    
    next();
  };
}
```

### Query Batching Protection

GraphQL allows multiple operations in a single request. Limit batch size:

```javascript
function batchLimitMiddleware(maxBatchSize) {
  return (req, res, next) => {
    if (Array.isArray(req.body)) {
      if (req.body.length > maxBatchSize) {
        return res.status(400).json({
          errors: [{
            message: `Batch size ${req.body.length} exceeds maximum allowed size of ${maxBatchSize}`,
            extensions: {
              code: 'BATCH_SIZE_EXCEEDED',
              batchSize: req.body.length,
              maxBatchSize: maxBatchSize
            }
          }]
        });
      }
      
      // Validate each operation in the batch
      for (let i = 0; i < req.body.length; i++) {
        const operation = req.body[i];
        if (!operation.query && !operation.extensions?.persistedQuery) {
          return res.status(400).json({
            errors: [{
              message: `Operation at index ${i} is missing query`,
              extensions: {
                code: 'INVALID_BATCH_OPERATION',
                index: i
              }
            }]
          });
        }
      }
    }
    
    next();
  };
}

// Usage
app.use('/graphql', batchLimitMiddleware(5)); // Max 5 operations per batch
```

### Query Cost Analysis

Analyze query cost and reject expensive queries:

```javascript
const costAnalysis = {
  // Field costs
  fields: {
    pilots: { base: 1, list: 10 },
    trainingSessions: { base: 2, list: 20 },
    aircraft: { base: 1, list: 5 },
    flightLogs: { base: 3, list: 30 },
    analytics: { base: 5, list: 50 }
  },
  
  // Argument multipliers
  arguments: {
    limit: (value) => Math.ceil(value / 10),
    first: (value) => Math.ceil(value / 10),
    last: (value) => Math.ceil(value / 10)
  },
  
  // Maximum allowed cost
  maxCost: 1000
};

function analyzeQueryCost(query, variables = {}) {
  const document = parse(query);
  let totalCost = 0;
  
  visit(document, {
    Field(node) {
      const fieldName = node.name.value;
      const fieldDef = costAnalysis.fields[fieldName];
      
      if (fieldDef) {
        let cost = fieldDef.base;
        
        // Check if it's a list field
        if (isListField(fieldName)) {
          cost = fieldDef.list;
          
          // Apply argument multipliers
          const limitArg = node.arguments?.find(a => a.name.value === 'limit');
          if (limitArg && limitArg.value.kind === 'IntValue') {
            const limit = parseInt(limitArg.value.value);
            cost *= Math.ceil(limit / 10);
          }
        }
        
        totalCost += cost;
      }
    }
  });
  
  return totalCost;
}
```

### GraphQL Error Formatting

Format errors consistently and hide internal details:

```javascript
function formatGraphQLError(error) {
  // Hide internal errors in production
  if (process.env.NODE_ENV === 'production') {
    if (error.message.includes('Database') || error.message.includes('ECONNREFUSED')) {
      return {
        message: 'Internal server error',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      };
    }
  }
  
  // Add request ID for debugging
  return {
    message: error.message,
    locations: error.locations,
    path: error.path,
    extensions: {
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    }
  };
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: formatGraphQLError
});
```

## Real Scenario: Securing a GraphQL Flight Training API

Consider a flight training API with these operations:

```graphql
type Query {
  pilots(limit: Int, offset: Int): [Pilot!]!
  pilot(id: ID!): Pilot
  trainingSessions(studentId: ID): [TrainingSession!]!
  aircraft: [Aircraft!]!
}

type Mutation {
  createPilot(input: CreatePilotInput!): Pilot!
  updatePilot(id: ID!, input: UpdatePilotInput!): Pilot!
  createTrainingSession(input: CreateTrainingSessionInput!): TrainingSession!
  gradeTrainingSession(id: ID!, grade: String!): TrainingSession!
}

type Subscription {
  onPilotUpdated(schoolId: ID!): Pilot!
  onTrainingSessionCreated(schoolId: ID!): TrainingSession!
}
```

### Security Configuration

```javascript
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  
  // Query complexity analysis
  plugins: [
    createComplexityPlugin({
      estimators: [
        fieldExtensionsEstimator(),
        simpleEstimator({ defaultComplexity: 1 })
      ],
      maximumComplexity: 1000,
      onComplete: (complexity) => {
        console.log(`Query complexity: ${complexity}`);
      }
    })
  ],
  
  // Validation rules
  validationRules: [
    depthLimitRule(10),
    createApolloQueryValidationRule((error) => {
      console.error('Query validation error:', error.message);
    })
  ],
  
  // Error formatting
  formatError: (error) => {
    // Do not expose internal errors
    if (error.message.includes('Database')) {
      return new Error('Internal server error');
    }
    return error;
  }
});
```

### Field-Level Authorization

```javascript
const resolvers = {
  Query: {
    pilots: requireAuth(async (parent, args, context) => {
      return db.pilots.findMany({
        take: args.limit || 20,
        skip: args.offset || 0
      });
    }),
    
    pilot: requireAuth(async (parent, { id }, context) => {
      const pilot = await db.pilots.findOne({ id });
      
      if (!pilot) {
        throw new NotFoundError('Pilot not found');
      }
      
      // Check access
      if (context.user.role !== 'admin' && 
          context.user.schoolId !== pilot.schoolId) {
        throw new ForbiddenError('Access denied');
      }
      
      return pilot;
    })
  },
  
  Pilot: {
    email: (parent, args, context) => {
      // Only the pilot or admins can see email
      if (context.user.id === parent.id || context.user.role === 'admin') {
        return parent.email;
      }
      return null;
    },
    
    trainingSessions: async (parent, args, context) => {
      // Use DataLoader to avoid N+1
      return context.loaders.trainingSessions.load(parent.id);
    }
  },
  
  Mutation: {
    createPilot: requireAuth(async (parent, { input }, context) => {
      // Validate input
      const validated = createPilotSchema.parse(input);
      
      // Check permissions
      if (!context.user.scopes.includes('pilot:write')) {
        throw new ForbiddenError('Insufficient permissions');
      }
      
      return db.pilots.create({ data: validated });
    }),
    
    gradeTrainingSession: requireRole('instructor', async (parent, { id, grade }, context) => {
      const session = await db.trainingSessions.findOne({ id });
      
      if (!session) {
        throw new NotFoundError('Training session not found');
      }
      
      // Instructors can only grade sessions at their school
      if (context.user.schoolId !== session.schoolId) {
        throw new ForbiddenError('Access denied');
      }
      
      return db.trainingSessions.update({
        where: { id },
        data: { grade, graded_by: context.user.id, graded_at: new Date() }
      });
    })
  }
};
```

### Subscription Security

```javascript
const subscriptionServer = SubscriptionServer.create({
  schema,
  execute,
  subscribe,
  onConnect: async (connectionParams, socket) => {
    // Require authentication
    const token = connectionParams.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const user = verifyToken(token);
    
    // Limit subscriptions per client
    const clientSubscriptions = subscriptionCounts.get(user.id) || 0;
    if (clientSubscriptions >= 5) {
      throw new Error('Too many subscriptions');
    }
    
    subscriptionCounts.set(user.id, clientSubscriptions + 1);
    
    return { user };
  },
  
  onDisconnect: async (socket) => {
    if (socket.user) {
      const current = subscriptionCounts.get(socket.user.id) || 0;
      subscriptionCounts.set(socket.user.id, Math.max(0, current - 1));
    }
  }
});
```

### Monitoring

Monitor GraphQL-specific metrics:

```javascript
const metrics = {
  queryComplexity: new Histogram({
    name: 'graphql_query_complexity',
    help: 'Query complexity distribution',
    buckets: [10, 50, 100, 200, 500, 1000]
  }),
  
  queryDepth: new Histogram({
    name: 'graphql_query_depth',
    help: 'Query depth distribution',
    buckets: [1, 2, 3, 5, 7, 10, 15]
  }),
  
  resolverDuration: new Histogram({
    name: 'graphql_resolver_duration_seconds',
    help: 'Resolver execution time',
    labelNames: ['resolver', 'type'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
  }),
  
  errors: new Counter({
    name: 'graphql_errors_total',
    help: 'Total GraphQL errors',
    labelNames: ['type', 'code']
  })
};

// Track complexity and depth
app.use('/graphql', (req, res, next) => {
  if (req.body.query) {
    const complexity = estimateComplexity(req.body.query);
    const depth = getDepth(req.body.query);
    
    metrics.queryComplexity.observe(complexity);
    metrics.queryDepth.observe(depth);
    
    if (complexity > 1000) {
      metrics.errors.inc({ type: 'complexity', code: 'EXCEEDED' });
    }
    
    if (depth > 10) {
      metrics.errors.inc({ type: 'depth', code: 'EXCEEDED' });
    }
  }
  
  next();
});
```

## Assessment

**Lab 1: Query Depth Protection** (30 minutes)

Implement a query depth limiter for a GraphQL API. Write middleware that: parses the query to calculate depth, rejects queries exceeding a configurable maximum depth, returns a clear error message with the current depth and maximum, and logs the rejected query. Write the complete implementation.

Grading: 24 points. 6 points per correctly implemented feature.

**Lab 2: Introspection Security** (25 minutes)

Design a strategy for managing GraphQL introspection in different environments: development (full introspection), staging (introspection with logging), production (introspection disabled). Include: configuration for each environment, middleware that enforces the policy, audit logging for introspection queries, and a mechanism to allow specific tools (like GraphQL Playground) in production.

Grading: 25 points. 5 points per correctly designed component.

**Lab 3: N+1 Prevention** (35 minutes)

Given this GraphQL schema:
```graphql
type School {
  id: ID!
  name: String!
  pilots: [Pilot!]!
  aircraft: [Aircraft!]!
}

type Pilot {
  id: ID!
  name: String!
  school: School!
  trainingSessions: [TrainingSession!]!
}
```

Write DataLoader implementations for: fetching schools by ID, fetching pilots by school ID, fetching aircraft by school ID, and fetching training sessions by pilot ID. Show how these DataLoaders are created per request and used in resolvers.

Grading: 28 points. 7 points per correctly implemented DataLoader.

## Evidence

- GraphQL Security: graphql.org/learn/serving-over-http/
- Apollo Server Security: apollographql.com/docs/apollo-server/security/overview/
- OWASP GraphQL Cheat Sheet: cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html
- DataLoader: github.com/graphql/dataloader
- Query Complexity Analysis: api.github.com/graphql/operations/ complexity
- Persisted Queries: github.com/apollographql/apollo-feature-requests/issues/257
