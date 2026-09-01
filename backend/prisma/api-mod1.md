# Module 1: API Fundamentals

When you first start building APIs, the landscape feels overwhelming. REST, GraphQL, gRPC, WebSocket, SOAP: each protocol has its own rules, its own ecosystem, and its own set of people who swear by it. The reality is simpler than the marketing suggests. Every API paradigm exists because it solves a specific set of problems well, and understanding those trade-offs is the first step toward building APIs that actually work in production.

This module covers the three dominant paradigms you will encounter in modern backend work: REST, GraphQL, and gRPC. We will look at what each one actually does under the hood, where each one breaks down, and how to pick the right one for a real project. We will also cover the HTTP fundamentals that underpin all of them, because if you do not understand HTTP methods, status codes, and request lifecycle, you will build fragile APIs no matter which paradigm you choose.

## Why APIs Exist

An API is a contract. One system says: "Send me this shaped request, and I will give you this shaped response." That is it. Every API: whether it is a REST endpoint returning JSON, a GraphQL resolver, or a gRPC service: is fundamentally a machine-readable agreement between two pieces of software.

The reason we care about API design is that bad APIs are expensive. They cause integration failures, security vulnerabilities, and maintenance nightmares. A well-designed API reduces the surface area for bugs, makes integration straightforward for consumers, and survives the inevitable evolution of requirements without requiring a rewrite.

There are three questions you should ask before choosing an API paradigm:

1. **Who is consuming this API?** A mobile app, a browser, another microservice, or a third-party developer?
2. **What does the data look like?** Flat records, deeply nested graphs, or binary payloads?
3. **What are the performance constraints?** Latency-sensitive real-time systems, or batch processing that can tolerate seconds?

The answers to these questions will point you toward the right paradigm more reliably than any trend piece or conference talk.

## REST: The Default Choice

REST (Representational State Transfer) is not a protocol. It is an architectural style defined by a set of constraints. Most APIs that call themselves "RESTful" are actually just HTTP APIs that return JSON. That is fine for most purposes, but understanding what REST actually requires helps you build better APIs.

The core constraints of REST are:

**Client-Server Separation.** The client and server are independent. The client does not know or care how the server stores data, and the server does not know or care how the client renders it. This separation means you can change the server implementation without breaking clients, as long as the contract (endpoints, request/response formats) stays the same.

**Statelessness.** Every request from the client must contain all the information the server needs to process it. The server does not store session state between requests. This is why authentication tokens are sent with every request: the server does not remember that you logged in five minutes ago. Each request is self-contained. This constraint makes horizontal scaling straightforward: any server instance can handle any request because there is no shared state.

**Cacheability.** Responses must declare themselves as cacheable or not. This is what the `Cache-Control`, `ETag`, and `Last-Modified` headers do. Proper caching can eliminate entire categories of performance problems, but it only works if the server correctly declares what can be cached.

**Uniform Interface.** This is the constraint most people think of when they think REST. It means using standard HTTP methods (GET, POST, PUT, PATCH, DELETE) in predictable ways, using resource-oriented URLs, and returning standard status codes. The uniform interface is what makes REST APIs learnable: once you understand the pattern, you can guess how a new endpoint works.

**Layered System.** The client does not know whether it is talking directly to the server or through a load balancer, API gateway, or cache. This transparency allows you to add infrastructure without changing the API.

### What REST Actually Looks Like

Consider an API for managing aircraft maintenance records:

```
GET    /api/v1/aircraft                    # List all aircraft
GET    /api/v1/aircraft/A320-001           # Get specific aircraft
POST   /api/v1/aircraft                    # Create new aircraft
PUT    /api/v1/aircraft/A320-001           # Replace aircraft record
PATCH  /api/v1/aircraft/A320-001           # Update partial fields
DELETE /api/v1/aircraft/A320-001           # Remove aircraft
```

Each URL identifies a resource. The HTTP method tells the server what action to take. The response includes a status code that tells the client whether it succeeded.

A successful GET returns 200 with the resource in the body. A successful creation returns 201 with the new resource. A failed lookup returns 404. An invalid request returns 400. A missing authentication token returns 401. This is the uniform interface in action.

### Where REST Breaks Down

REST works well for CRUD operations on flat resources. It struggles when:

**The data is deeply nested.** If you need to fetch an aircraft, its maintenance history, each maintenance event's parts, and each part's supplier: you are looking at four sequential HTTP requests with traditional REST. This is the N+1 problem at the API level. You can mitigate it with compound endpoints or sparse fieldsets, but the solution always feels bolted on.

**The client needs different data shapes.** A mobile app might need a summary of aircraft data (name, status, last maintenance date), while a dashboard needs the full record with all history. With REST, you either return everything (wasting bandwidth on mobile) or create separate endpoints for each use case (multiplying your maintenance surface).

**Real-time updates are required.** REST is request-response. The client asks, the server answers, the conversation ends. If you need live updates: like a status board that shows aircraft maintenance progress in real time: REST alone does not work. You need WebSockets or server-sent events on top of REST.

**The operations are not resource-oriented.** Actions like "recalculate maintenance schedule" or "generate compliance report" do not map cleanly to CRUD operations. You end up with awkward endpoints like `POST /api/v1/aircraft/A320-001/actions/recalculate-schedule` which is REST-ish but not really REST.

## GraphQL: The Flexible Alternative

GraphQL was created by Facebook in 2012 and open-sourced in 2015. It was born out of a specific pain: the mobile News Feed needed data from dozens of backend services, and building a new REST endpoint for every screen was unsustainable.

GraphQL solves this by letting the client specify exactly what data it needs. Instead of the server deciding the shape of the response, the client sends a query that describes the data it wants, and the server returns exactly that data: no more, no less.

### How GraphQL Works

A GraphQL API exposes a single endpoint. Instead of multiple URLs for different resources, there is one URL (usually `/graphql`) and the query determines what data comes back.

A client query might look like this:

```graphql
query {
  aircraft(registration: "A320-001") {
    registration
    model
    status
    maintenanceHistory {
      date
      type
      technician
      partsReplaced {
        partNumber
        name
        supplier {
          name
          country
        }
      }
    }
  }
}
```

The server responds with exactly the shape the client requested:

```json
{
  "data": {
    "aircraft": {
      "registration": "A320-001",
      "model": "Airbus A320",
      "status": "IN_SERVICE",
      "maintenanceHistory": [
        {
          "date": "2026-03-15",
          "type": "A_CHECK",
          "technician": "J. Smith",
          "partsReplaced": [
            {
              "partNumber": "APU-4521",
              "name": "APU Starter Motor",
              "supplier": {
                "name": "AeroParts Inc.",
                "country": "US"
              }
            }
          ]
        }
      ]
    }
  }
}
```

One request. All the data. No over-fetching, no under-fetching.

### The GraphQL Schema

GraphQL APIs are defined by a schema. The schema is the contract: it defines every type, every field, and every operation available. This is written in the Schema Definition Language (SDL):

```graphql
type Aircraft {
  id: ID!
  registration: String!
  model: String!
  status: AircraftStatus!
  maintenanceHistory: [MaintenanceRecord!]!
}

enum AircraftStatus {
  IN_SERVICE
  IN_MAINTENANCE
  GROUNDED
}

type Query {
  aircraft(registration: String!): Aircraft
  aircraftList(status: AircraftStatus, limit: Int): [Aircraft!]!
}

type Mutation {
  createAircraft(input: CreateAircraftInput!): Aircraft!
  updateMaintenanceStatus(id: ID!, status: AircraftStatus!): Aircraft!
}
```

The schema serves as both documentation and validation. If a client sends a query that references a field that does not exist, the server rejects it before executing anything. This is a significant advantage over REST, where malformed requests might partially succeed and return unexpected data.

### Where GraphQL Struggles

**Caching is harder.** With REST, every unique URL is a cacheable resource. HTTP caching infrastructure (CDNs, browser caches, reverse proxies) understands this natively. With GraphQL, every request goes to the same URL with different query bodies. You cannot use standard HTTP caching. You need application-level caching solutions like persisted queries or response caching within the GraphQL server itself.

**Complexity shifts to the client.** The client now has to know the schema, construct queries, handle pagination (which is not standardized in GraphQL like it is in REST), and manage local state. Client-side GraphQL libraries like Apollo Client or Relay handle this, but they add significant complexity.

**N+1 queries are the default.** Because GraphQL resolvers are independent, a naive implementation will make one database query per field. Fetching 50 aircraft with their maintenance history could generate hundreds of database queries. DataLoader is the standard solution: it batches and deduplicates database calls within a single request: but it is an additional layer you must implement and maintain.

**Security concerns are different.** A client can construct arbitrarily deep or complex queries that consume enormous server resources. An attacker could write a query that traverses every relationship in your database, effectively performing a denial-of-service attack. Query depth limiting, query complexity analysis, and rate limiting by query cost are all necessary but not built into the GraphQL spec.

**File uploads are not part of the spec.** The GraphQL specification does not define how to handle file uploads. The standard workaround is multipart form requests with a specific encoding format, but this adds friction and is less intuitive than REST's native multipart support.

## gRPC: The Performance Champion

gRPC is a remote procedure call (RPC) framework built on HTTP/2 and Protocol Buffers (protobuf). It was originally developed by Google and is now maintained by the CNCF. If REST is about resources and GraphQL is about queries, gRPC is about functions.

With gRPC, you define services using Protocol Buffers:

```protobuf
syntax = "proto3";

service AircraftService {
  rpc GetAircraft (AircraftRequest) returns (Aircraft);
  rpc ListAircraft (ListAircraftRequest) returns (stream Aircraft);
  rpc UpdateMaintenance (MaintenanceUpdate) returns (UpdateResponse);
}

message AircraftRequest {
  string registration = 1;
}

message Aircraft {
  string registration = 1;
  string model = 2;
  string status = 3;
  repeated MaintenanceRecord maintenance_history = 4;
}
```

From this definition, gRPC generates client stubs and server interfaces in whatever language you are using. The client calls a method on the stub as if it were a local function call, and gRPC handles the serialization, transmission, and deserialization.

### Why gRPC Is Fast

**Binary serialization.** Protocol Buffers serialize data to compact binary format. A JSON representation of an aircraft record might be 500 bytes; the protobuf representation might be 150 bytes. This matters when you are sending millions of messages.

**HTTP/2.** gRPC requires HTTP/2, which provides multiplexing (multiple requests over a single connection), header compression, and server push. This eliminates the connection overhead that HTTP/1.1 imposes and allows much higher throughput.

**Streaming.** gRPC supports four communication patterns: unary (one request, one response), server streaming, client streaming, and bidirectional streaming. Server streaming is particularly useful for real-time data feeds: imagine a service that streams live aircraft telemetry data to monitoring dashboards.

**Strong typing.** The protobuf schema generates type-safe code in your language of choice. If you send a field of the wrong type, the compiler catches it. If the server returns a field that the client does not expect, it is silently ignored rather than causing a runtime error.

### Where gRPC Struggles

**Browser support is limited.** gRPC requires HTTP/2 trailers, which browsers do not fully support. The workaround is gRPC-Web, which proxies gRPC calls through an HTTP/1.1 gateway, but this adds latency and reduces some of gRPC's advantages. If your primary consumers are browsers, REST or GraphQL is usually the better choice.

**Debugging is harder.** JSON is human-readable. Protobuf is not. When a gRPC request fails, you cannot simply look at the request body in your browser's network tab. You need protobuf decoding tools to inspect the payload. This makes development and debugging slower, especially for teams new to gRPC.

**The ecosystem is smaller.** REST has decades of tooling: documentation generators, testing tools, mock servers, API gateways. GraphQL has a growing but still smaller ecosystem. gRPC's tooling is mature in the Go and Java ecosystems but less developed in other languages.

**Contract evolution is strict.** Protocol Buffers enforce backward compatibility through field numbering. You can add new fields without breaking existing clients, but you cannot change field numbers or types. Renaming fields is allowed (the field number is what matters), but the rules are less forgiving than JSON's flexibility.

## HTTP Fundamentals

Regardless of which API paradigm you choose, HTTP is the transport layer. Understanding HTTP deeply is non-negotiable for API work.

### HTTP Methods

**GET** retrieves a resource. It is safe (it does not modify state) and idempotent (calling it multiple times produces the same result). GET requests should never have side effects. If clicking a link triggers a database write, something is wrong.

**POST** creates a resource or triggers a non-idempotent operation. The server decides the URL of the new resource and returns it in the response. POST is not idempotent: sending the same POST request twice might create two resources.

**PUT** replaces a resource entirely. It is idempotent: sending the same PUT request multiple times produces the same result (the resource is in the same state each time). PUT requires the client to send the complete resource representation. If you send a PUT with only two fields, the other fields might be lost.

**PATCH** partially updates a resource. It is not necessarily idempotent (though it can be, depending on the implementation). PATCH sends only the fields that need to change, leaving everything else untouched.

**DELETE** removes a resource. It is idempotent: deleting something that is already deleted is a no-op (the result is the same as if it had not been deleted the first time).

### Status Codes

Status codes tell the client what happened. Using them correctly is one of the simplest ways to make your API more usable.

**2xx Success:**
- `200 OK`: The request succeeded. Used for GET responses, and for PUT/PATCH/DELETE when you return the updated resource.
- `201 Created`: A new resource was created. Used for POST responses. Should include a `Location` header with the URL of the new resource.
- `204 No Content`: The request succeeded but there is no body to return. Used for DELETE operations, or PUT/PATCH when you do not return the updated resource.

**3xx Redirection:**
- `301 Moved Permanently`: The resource has a new permanent URL. Clients should update their bookmarks.
- `304 Not Modified`: The resource has not changed since the last request. Used with caching headers.

**4xx Client Errors:**
- `400 Bad Request`: The request is malformed. The server could not understand it. This is for syntax errors, missing required fields, or invalid data types.
- `401 Unauthorized`: The client is not authenticated. Despite the name, this means "not logged in," not "not authorized." The `WWW-Authenticate` header should explain how to authenticate.
- `403 Forbidden`: The client is authenticated but not authorized to perform this action. The server understood the request but refuses to fulfill it.
- `404 Not Found`: The resource does not exist. This is also used when a resource exists but the client should not know about it (to avoid leaking information about what resources exist).
- `409 Conflict`: The request conflicts with the current state of the resource. For example, trying to create a user with an email that already exists.
- `422 Unprocessable Entity`: The request is syntactically correct but semantically invalid. For example, a date string in the right format but representing February 31.
- `429 Too Many Requests`: The client has exceeded the rate limit. The `Retry-After` header should tell the client when to try again.

**5xx Server Errors:**
- `500 Internal Server Error`: The server encountered an unexpected condition. This is the generic "something broke" code. In production, this should trigger alerts.
- `502 Bad Gateway`: The server received an invalid response from an upstream server. Common in microservice architectures.
- `503 Service Unavailable`: The server is temporarily unable to handle the request, usually due to maintenance or overload. The `Retry-After` header should indicate when to try again.
- `504 Gateway Timeout`: The upstream server did not respond in time.

### Headers That Matter

**Content-Type** tells the client what format the body is in. For REST APIs, this is usually `application/json`. For GraphQL, it is also `application/json` but the body is a query string. For gRPC, it is `application/grpc`.

**Authorization** carries authentication credentials. For API keys, it might be `Authorization: ApiKey abc123`. For JWTs, it is `Authorization: Bearer eyJhbGci...`.

**Accept** tells the server what format the client wants the response in. This enables content negotiation: the same endpoint can return JSON, XML, or CSV depending on what the client requests.

**Cache-Control** tells caches (browser, CDN, reverse proxy) how to handle the response. `Cache-Control: no-store` means never cache this. `Cache-Control: max-age=3600` means cache for one hour.

**ETag** is a response header that identifies a specific version of a resource. On subsequent requests, the client sends `If-None-Match: <etag>`, and the server returns 304 Not Modified if the resource has not changed. This is how conditional requests work.

**CORS headers** (`Access-Control-Allow-Origin`, etc.) control which domains can make cross-origin requests. Getting CORS wrong is one of the most common sources of "it works in Postman but not in the browser" bugs.

## Choosing an API Paradigm

Here is a decision framework that has held up across dozens of real projects:

**Choose REST when:**
- Your data model is naturally resource-oriented (CRUD operations on entities)
- Your consumers are diverse (browsers, mobile apps, third-party developers)
- You want maximum compatibility with existing infrastructure (CDNs, caches, API gateways)
- Your team is small and needs the simplest possible approach
- You are building a public API that third-party developers will consume

**Choose GraphQL when:**
- Your clients need different data shapes for the same resources
- You have deeply nested or highly connected data
- You want to eliminate over-fetching and under-fetching
- Your frontend team is capable of writing and maintaining GraphQL queries
- You are building a complex frontend (dashboard, data explorer, admin panel)

**Choose gRPC when:**
- Your primary consumers are backend services (microservice-to-microservice communication)
- Latency and throughput are critical constraints
- You need bidirectional streaming
- You want strongly typed contracts between services
- Your team is comfortable with Protocol Buffers and HTTP/2

**In practice, most systems use a combination.** A typical architecture might use:
- REST for the public API that third-party developers consume
- GraphQL for the internal frontend API that powers the web and mobile apps
- gRPC for inter-service communication within the backend

The key is not to pick one paradigm and force everything through it. Each paradigm has strengths. Use them where they are strongest.

## Real Scenario: Choosing an API Paradigm for a Flight Training Platform

Imagine you are building a flight training management platform. The system needs to:

1. **Expose a public API** for third-party simulation software to query training modules and submit flight logs.
2. **Power a web dashboard** where instructors monitor student progress across multiple courses, aircraft, and flight hours.
3. **Connect backend services**: the scheduling service needs to talk to the aircraft service, which needs to talk to the billing service.

Here is how you would apply the decision framework:

**Public API: REST.** Third-party developers are familiar with REST. They want predictable URLs, standard HTTP methods, and JSON responses. They do not want to learn a custom query language. You expose `GET /api/v1/training-modules`, `POST /api/v1/flight-logs`, and standard pagination with `?page=1&limit=20`. Documentation is straightforward with OpenAPI/Swagger.

**Web dashboard: GraphQL.** The dashboard needs to show different data depending on the view. The student overview page needs student names, course progress, and upcoming lessons. The detailed flight log page needs every flight record with weather data, instructor notes, and aircraft details. With GraphQL, the dashboard team can write queries tailored to each view without asking the API team to build new endpoints.

**Inter-service communication: gRPC.** When the scheduling service needs to check aircraft availability, it calls the aircraft service via gRPC. The request is small, the response is fast, and both services share a protobuf contract that ensures type safety. No JSON parsing, no schema drift, no guessing what fields might be present.

This hybrid approach is not theoretical. It is how most successful platforms operate at scale. The skill is not in mastering one paradigm: it is in knowing which one to reach for in each situation.

## Assessment

**Lab 1: HTTP Method Classification** (30 minutes)

Given a set of 20 API operations (e.g., "create a new pilot record," "retrieve a list of aircraft," "update a pilot's certification status," "delete a training session"), classify each by the appropriate HTTP method and status code. Write your answers as a table with columns: Operation, HTTP Method, Success Status Code, Error Status Code.

Grading: 15 points. 0.75 points per correct classification. Partial credit for correct method but wrong status code.

**Lab 2: Paradigm Selection** (45 minutes)

You are given three system requirements documents:
- A public API for weather data (consumed by mobile apps, dashboards, and third-party tools)
- An internal API for a real-time flight tracking dashboard (live position updates, aircraft status changes)
- A microservice communication layer for an airline operations platform (15 services communicating synchronously and asynchronously)

For each system, write a 200-word justification for which API paradigm you would choose and why. Identify at least two specific trade-offs in each decision.

Grading: 30 points. 10 points per system. 5 points for paradigm choice, 5 points for quality of justification and trade-off identification.

**Lab 3: Status Code Audit** (30 minutes)

You are given a REST API specification with 15 endpoints. Three of the endpoints use incorrect status codes (e.g., returning 200 when 201 is appropriate, returning 400 when the real issue is authentication, returning 200 for error cases). Find all three errors, explain why the current code is wrong, and provide the correct status code with justification.

Grading: 30 points. 10 points per error found and correctly corrected.

## Evidence

- REST architectural constraints: Fielding, R. (2000). Architectural Styles and the Design of Network-based Software Architectures. Chapter 5.
- GraphQL specification: graphql.org/learn/intro-to-graphql (official specification)
- gRPC overview: grpc.io/docs/what-is-grpc/introduction/
- HTTP/1.1 semantics: RFC 9110 (HTTP Semantics)
- HTTP/2: RFC 9113 (HTTP/2)
- Protocol Buffers encoding: protobuf.dev/programming-guides/encoding/
- API design comparison: Berrut, C. (2023). "REST vs GraphQL vs gRPC: Which API to use?" IEEE Software.
