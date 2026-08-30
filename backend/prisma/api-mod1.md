# Module 1 — API Fundamentals: REST, GraphQL, and gRPC

## What You'll Actually Do

Pick the right API paradigm for the job. You'll build the same data-fetching feature three different ways — REST, GraphQL, and gRPC — and understand the tradeoffs each one forces on you. This isn't theory; you'll wire up a real backend that serves product data to a frontend client using all three approaches, then decide which one fits which scenario.

---

## REST: The Default That Actually Works

REST (Representational State Transfer) uses HTTP verbs on URLs that represent resources. It's the default for a reason: it works with every tool, every proxy, every cache, and every developer already knows it.

```
GET    /api/products          → list products
GET    /api/products/42       → single product
POST   /api/products          → create product
PUT    /api/products/42       → replace product
DELETE /api/products/42       → delete product
```

```javascript
// Express.js REST endpoint
app.get('/api/products/:id', async (req, res) => {
  const product = await db.product.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

app.post('/api/products', async (req, res) => {
  const { name, price, category } = req.body;
  const product = await db.product.create({
    data: { name, price: Number(price), category },
  });
  res.status(201).json(product);
});
```

**When REST works well:** CRUD apps, public APIs, microservices that need broad tooling support, anything that benefits from HTTP caching.

**When REST hurts:** When the client needs to stitch data from multiple endpoints, or when you're over-fetching fields nobody uses.

---

## GraphQL: The Client Decides What It Needs

GraphQL gives clients a single endpoint where they specify exactly what data they want. The server defines a schema, the client sends a query, and the response matches the query shape.

```graphql
type Product {
  id: ID!
  name: String!
  price: Float!
  category: Category!
  reviews: [Review!]!
}

type Query {
  product(id: ID!): Product
  products(category: String): [Product!]!
}
```

```javascript
// Apollo Server resolver
const resolvers = {
  Query: {
    product: (_, { id }) => db.product.findUnique({ where: { id: Number(id) } }),
    products: (_, { category }) =>
      db.product.findMany({ where: category ? { category } : {} }),
  },
  Product: {
    reviews: (product) => db.review.findMany({ where: { productId: product.id } }),
  },
};
```

```graphql
# Client query — gets exactly what it needs
query {
  product(id: 42) {
    name
    price
    reviews {
      rating
      comment
    }
  }
}
```

**When GraphQL works well:** Complex frontend data needs, mobile apps on slow networks (avoid over-fetching), products where multiple teams build different UIs on the same API.

**When GraphQL hurts:** Simple CRUD APIs that don't need it, file uploads (it's awkward), situations where your team doesn't want to maintain a schema.

---

## gRPC: When Performance Matters More Than Readability

gRPC uses Protocol Buffers for serialization and HTTP/2 for transport. It's fast, strongly typed, and designed for service-to-service communication.

```protobuf
// product.proto
syntax = "proto3";

service ProductService {
  rpc GetProduct (GetProductRequest) returns (Product);
  rpc ListProducts (ListProductsRequest) returns (stream Product);
}

message Product {
  int32 id = 1;
  string name = 2;
  double price = 3;
  string category = 4;
}

message GetProductRequest {
  int32 id = 1;
}

message ListProductsRequest {
  string category = 1;
}
```

```javascript
// Server
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDef = protoLoader.loadSync('product.proto');
const proto = grpc.loadPackageDefinition(packageDef).ProductService;

function getProduct(call, callback) {
  const product = db.product.findUnique({ where: { id: call.request.id } });
  callback(null, product);
}

const server = new grpc.Server();
server.addService(proto.ProductService.service, { GetProduct: getProduct });
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {});
```

```javascript
// Client
const client = new proto.ProductService('localhost:50051', grpc.credentials.createInsecure());
client.GetProduct({ id: 42 }, (err, product) => {
  console.log(product);
});
```

**When gRPC works well:** Internal microservice communication, high-throughput systems, streaming data (bidirectional), polyglot environments (Go, Java, Python services talking to each other).

**When gRPC hurts:** Browser clients (needs gRPC-Web proxy), debugging (binary format), public APIs where developers expect REST.

---

## Choosing the Right Paradigm

```
REST    → Public APIs, CRUD, broad compatibility
GraphQL → Complex client data needs, multiple frontends
gRPC    → Internal services, performance-critical, streaming
```

You don't always pick one. A common architecture: REST for the public API, GraphQL for the web/mobile frontend, gRPC for internal service communication.

---

## Assessment

**Lab Task: Build All Three (60 minutes)**

Given a database with `users`, `posts`, and `comments`, implement the same data-fetching feature using all three paradigms:

1. **REST:** Create Express endpoints — `GET /api/users/:id`, `GET /api/users/:id/posts`, `GET /api/posts/:id/comments`
2. **GraphQL:** Define a schema with `User`, `Post`, `Comment` types. Write resolvers that return a user with their posts and nested comments in a single query.
3. **gRPC:** Define a proto file with `UserService` and a `GetUserWithPosts` RPC. Implement the server and a test client.

**Deliverables:** Three files — `rest-server.js`, `graphql-server.js`, `grpc-server.js` — plus a `product.proto` and a test script that hits each endpoint.

**Grading:**
- REST endpoints return correct data and status codes: 25%
- GraphQL schema resolves nested data correctly: 30%
- gRPC proto compiles and server/client work: 25%
- Test script demonstrates all three working: 20%

---

## Evidence

Take screenshots of each test script output. Note the response time differences between the three approaches when fetching the same dataset. Write a brief comparison (3-5 sentences) on which paradigm you'd pick for a real project and why.
