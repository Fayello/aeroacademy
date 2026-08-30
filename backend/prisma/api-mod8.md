# Module 8 — GraphQL Security: Introspection, Depth Limiting, and Batching

## What You'll Actually Do

Lock down a GraphQL API. You'll disable introspection in production, implement query depth limiting to prevent nested abuse, control batching to stop denial-of-service, and add query complexity analysis. GraphQL gives clients power — your job is making sure they don't abuse it.

---

## The Problem: GraphQL Is an Attack Surface

GraphQL lets clients construct arbitrarily complex queries. An attacker can:

- Query your entire schema via introspection
- Build deeply nested queries that hammer your database
- Send batches of hundreds of queries in a single request
- Enumerate every field and type to map your data model

```graphql
# This innocent-looking query hits your database 1000 times
{
  users {
    posts {
      comments {
        author {
          posts {
            comments {
              author {
                posts {
                  title
                }
              }
            }
          }
        }
      }
    }
  }
}
```

---

## Disable Introspection in Production

Introspection lets anyone discover your entire schema. Useful in development, dangerous in production.

```javascript
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');

const server = new ApolloServer({
  introspection: process.env.NODE_ENV !== 'production',
  // ... schema, resolvers
});
```

**But don't rely on this alone.** Determined attackers can use field suggestion errors and response shapes to infer schema structure. Defense in depth.

---

## Query Depth Limiting

Reject queries that nest too deep. This is the single most effective GraphQL security measure.

```javascript
const depthLimit = require('graphql-depth-limit');

const server = new ApolloServer({
  validationRules: [depthLimit(5)], // max 5 levels of nesting
});
```

**Without depth limiting:**

```
# Query with nesting depth of 8 — each level multiplies DB queries
query {
  users {              # depth 1 → N users
    posts {            # depth 2 → N × M posts
      comments {       # depth 3 → N × M × K comments
        author {       # depth 4
          posts {      # depth 5
            comments { # depth 6
              author { # depth 7
                name   # depth 8
              }
            }
          }
        }
      }
    }
  }
}
```

**With depth limit of 5:**

```json
{
  "errors": [{
    "message": "Query depth exceeds maximum of 5"
  }]
}
```

---

## Query Complexity Analysis

Assign costs to fields and reject queries that exceed a complexity budget.

```javascript
const { createComplexityRule } = require('graphql-query-complexity');

const server = new ApolloServer({
  validationRules: [
    createComplexityRule({
      maximumComplexity: 1000,
      estimators: [
        // Each list field multiplies complexity by its default limit
        simpleEstimator({ defaultComplexity: 1 }),
        // Override specific fields
        fieldExtensionsEstimator(),
      ],
      onComplete: (complexity) => {
        if (complexity > 500) {
          console.warn(`High complexity query: ${complexity}`);
        }
      },
    }),
  ],
});
```

```javascript
// In your schema, assign complexity costs
const typeDefs = `#graphql
  type Query {
    user(id: ID!): User @complexity(value: 1)
    users(limit: Int @default(value: 20)): [User!]! @complexity(value: 5, multipliers: ["limit"])
  }

  type User {
    id: ID!
    name: String!
    posts: [Post!]! @complexity(value: 10) # expensive: DB join
    comments: [Comment!]! @complexity(value: 10)
  }
`;
```

---

## Batching: Limit Queries Per Request

GraphQL allows multiple operations in one request. Without limits, an attacker sends hundreds.

```javascript
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');

// Custom plugin to limit batching
const batchingLimitPlugin = {
  async requestDidStart() {
    return {
      async didResolveOperation(context) {
        // Count operations in the request
        const query = context.request.query;
        const operationCount = (query.match(/{/g) || []).length;

        if (operationCount > 5) {
          throw new Error('Too many operations in a single request');
        }
      },
    };
  },
};

const server = new ApolloServer({
  plugins: [batchingLimitPlugin],
});
```

**Better approach:** Disable batching entirely if you don't need it.

```javascript
// Express middleware to reject batched GraphQL requests
function rejectBatchedQueries(req, res, next) {
  if (Array.isArray(req.body)) {
    return res.status(400).json({
      error: 'Batched queries are not supported',
    });
  }
  next();
}

app.use('/graphql', rejectBatchedQueries);
```

---

## Persisted Queries: No Raw Query Strings

Force clients to pre-register queries by hash. The client sends only the hash, not the full query. This eliminates query injection entirely.

```javascript
const { ApolloServerPluginCacheControl } = require('@apollo/server/plugin/cacheControl');
const { InMemoryLRUCache } = require('@apollo/utils.keyvadapter');

// Use Apollo's automatic persisted queries
const server = new ApolloServer({
  // Clients send a hash, not the full query
  // Server looks up the query by hash
  // Reduces bandwidth and eliminates injection
});
```

```javascript
// Client side: instead of sending the full query
// Send: { extensions: { persistedQuery: { sha256Hash: "abc123..." } } }
// Server resolves the hash to the actual query
```

---

## Rate Limiting for GraphQL

Standard rate limiting counts requests. GraphQL needs to count complexity.

```javascript
async function graphqlRateLimit(req, res, next) {
  const userId = req.user?.id || req.ip;
  const key = `gql:${userId}`;

  // Check a complexity budget, not just request count
  const budget = await redis.get(key);
  const remaining = budget ? parseInt(budget) : 1000;

  if (remaining <= 0) {
    return res.status(429).json({ error: 'Complexity budget exhausted' });
  }

  // Parse and estimate query complexity
  const query = req.body.query;
  const complexity = estimateComplexity(query);

  if (complexity > remaining) {
    return res.status(429).json({
      error: 'Query too complex',
      remaining,
      requested: complexity,
    });
  }

  await redis.decrby(key, complexity);
  next();
}
```

---

## Security Checklist

```
1. Disable introspection in production
2. Limit query depth (5-7 levels max)
3. Set complexity budget (1000-5000)
4. Limit batching (5 operations max, or disable)
5. Use persisted queries when possible
6. Rate limit by complexity, not just request count
7. Log slow and high-complexity queries
8. Validate input types in resolvers (don't trust client types)
```

---

## Assessment

**Lab Task: Secure a GraphQL API (50 minutes)**

Given a working GraphQL API with users, posts, and comments:

1. Disable introspection in production mode
2. Implement query depth limiting (max 5)
3. Add complexity analysis with a budget of 1000
4. Limit batching to 3 operations per request
5. Write a test script that tries: introspection query, deeply nested query, batched queries, and high-complexity queries
6. Verify all security measures reject malicious queries

**Deliverables:** `secure-graphql.js` with all security middleware, `test-graphql-security.sh` script, `schema.graphql` with complexity annotations.

**Grading:**
- Introspection is disabled in production: 15%
- Depth limiting rejects nested queries: 25%
- Complexity analysis rejects expensive queries: 25%
- Batching limits enforced: 15%
- Test script demonstrates all security measures: 20%

---

## Evidence

Run the test script and screenshot the rejection responses. Show a normal query that succeeds, then show each security measure blocking an attack. Include the schema with complexity annotations.
