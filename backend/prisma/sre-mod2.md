# Module 2 — SLIs, SLOs, SLAs

## Service Level Indicators: What You Actually Measure

Service Level Indicators are the raw measurements of your service's behavior. They are the numbers you collect from your monitoring systems: latency percentiles, error rates, throughput, and availability. An SLI is not a target. It is not a promise. It is an observation. It tells you what your service is actually doing right now, what it did yesterday, and what it has been doing for the past month.

The distinction between an SLI and a metric is subtle but important. A metric is any measurement. CPU utilization is a metric. Memory usage is a metric. Disk I/O is a metric. These are infrastructure metrics. An SLI is a metric that directly reflects the user's experience. When a user makes an API call, the latency they experience is an SLI. When a user submits a form, whether it succeeds or fails is an SLI. The infrastructure metrics that caused the latency or failure are supporting data, not SLIs themselves.

There are four common types of SLIs, corresponding to the four golden signals.

**Availability SLI** measures the proportion of requests that are served successfully. The formula is: (total requests - failed requests) / total requests. A request is "successful" if it returns the expected response with the expected data within the expected time frame. A request that returns HTTP 200 but takes 30 seconds when it should take 200ms is arguably not successful. A request that returns HTTP 200 but returns incorrect data is definitely not successful.

There are two ways to measure availability: the time-based approach and the request-based approach. The time-based approach asks: what percentage of time was the service available? If the service was down for 10 minutes in a 24-hour period, availability was 99.3%. The request-based approach asks: what percentage of requests were successful? If the service received 1,000,000 requests and 999,000 succeeded, availability was 99.9%. The request-based approach is more accurate because it captures partial degradation. A service can be "up" (responding to health checks) but returning errors for 50% of requests. The time-based approach would show 100% availability. The request-based approach would correctly show 50%.

**Latency SLI** measures how long it takes to serve requests. As discussed in Module 1, you need to measure this with percentiles, not averages. The specific percentiles you choose depend on your SLO. If you define an SLO that says "99% of requests must complete within 500ms," you need to measure p99 latency. If you define an SLO that says "50% of requests must complete within 100ms," you need to measure p50 latency. The SLI and the SLO must use the same percentile or you are measuring the wrong thing.

For services that handle different types of requests with different expected latencies, you may need multiple latency SLIs. A web application might have one SLI for page load times (expected: under 2 seconds), another for API calls (expected: under 500ms), and another for background jobs (expected: under 30 seconds). Trying to combine all of these into a single latency SLI produces a meaningless number.

**Throughput SLI** measures the volume of work your service handles. This is often the least important SLI for reliability purposes, but it matters for capacity planning. If your throughput SLI shows that you are handling 10,000 requests per second today and you expect 50,000 next quarter, you need to plan for that growth. Throughput also interacts with latency and errors. If throughput increases but latency stays constant and errors stay low, your system is scaling well. If throughput increases and latency increases or errors increase, you are hitting a limit.

**Error SLI** measures the proportion of requests that fail. This is different from availability. Availability measures the proportion of requests that succeed. Error rate measures the proportion that fail. They are inverses of each other. But error rate can be more nuanced. You might want to track different error categories separately: client errors (4xx), server errors (5xx), timeout errors, and application-level errors. Each tells you something different about what is going wrong.

The key to good SLIs is that they must be measurable, meaningful, and actionable. Measurable means you can collect the data reliably with your existing monitoring infrastructure. If you cannot measure it, you cannot set an SLO for it. Meaningful means the SLI reflects something the user actually cares about. Nobody cares about your CPU utilization. Users care about whether the page loads and whether their data is correct. Actionable means that when the SLI breaches its target, you can do something about it. If an SLI shows a problem but you have no way to diagnose or fix it, the SLI is just noise.

## Setting SLOs: The Process

Service Level Objectives are targets for your SLIs. An SLO says: "we believe our service should maintain this level of performance for this proportion of time." An SLO is not a contract. It is not a guarantee. It is an internal engineering target that guides decision-making.

The SLO setting process starts with understanding your users. What do they expect? What do they need? What level of degradation causes them real pain? These questions are not answered by engineering teams in isolation. They require input from product management, customer success, sales, and support. Engineering provides the data on what is achievable. Product provides the data on what is needed. The SLO is the intersection.

Here is a practical framework for setting SLOs.

**Step 1: Identify the critical user journeys.** Not all endpoints and features are equally important. The checkout flow is more critical than the settings page. The login flow is more critical than the profile update. Identify the top 5-10 user journeys that are essential to the service's value proposition.

**Step 2: Define SLIs for each critical journey.** What does the user experience for each journey? How fast should it be? What failure modes are unacceptable? For the checkout flow, the SLIs might be: availability (requests succeed), latency (completes within 3 seconds), and correctness (order is created with the right items and price).

**Step 3: Set initial SLO targets.** Start with what your system currently delivers, plus a small improvement. If your checkout flow currently succeeds 99.5% of the time, set the SLO at 99.7%. If you set it at 99.99% right away, you will immediately breach it and have no error budget. The goal is to set an SLO that is achievable but requires some work to maintain.

**Step 4: Validate with stakeholders.** Present the proposed SLOs to product, support, and customer success. Ask them: "if we meet this target, will our users be satisfied? If we breach this target, will our users notice and care?" Adjust based on their input. Product might say "99.7% is not good enough, our enterprise customers require 99.9%." Support might say "if the checkout flow takes more than 5 seconds, we get 50 tickets per hour." Both inputs are valuable.

**Step 5: Calculate the error budget.** Once the SLO is set, calculate the error budget. If the SLO is 99.9% over a 30-day window, the error budget is 0.1% of 30 days = 43.2 minutes. This number determines how much risk the team can take.

**Step 6: Establish error budget policies.** What happens when the error budget is full? What happens when it is depleted? These policies should be agreed upon before the SLO goes into effect, not after the first breach. Common policies include: when the budget is above 50%, all changes are permitted. When it is between 25-50%, only low-risk changes are permitted. When it is below 25%, only reliability work is permitted. When it is depleted, a freeze on all changes until reliability improves.

**Step 7: Review and iterate.** SLOs are not set in stone. Review them quarterly. If you are consistently meeting your SLOs with large error budgets, the targets might be too easy. If you are consistently breaching them, the targets might be too aggressive. The SLO should be a living target that evolves with your service and your users' expectations.

A common mistake when setting SLOs is using too many. If you have 50 SLOs, you cannot meaningfully track them all. Start with 3-5 SLOs for your most critical services. You can always add more later as your practice matures. Another mistake is setting SLOs based on what you want to promise customers rather than what you can actually deliver. An SLO that you constantly breach is worse than no SLO at all because it erodes trust.

## SLAs: The Business Layer

Service Level Agreements are the business and legal layer that sits on top of SLOs. An SLA is a contract between your organization and your customers (or partners, or vendors) that specifies what level of service you will provide and what happens if you fail to meet it. The SLO is your internal target. The SLA is the external promise.

SLAs typically include several components. First, the service metrics: what is being measured, how it is measured, and over what time period. Second, the target levels: what the agreed-upon thresholds are. Third, the remedies: what the customer is entitled to if the targets are not met. Remedies typically take the form of service credits. If availability falls below 99.9% in a given month, the customer receives a 10% credit on their next bill. If it falls below 99%, the credit might be 25%. If it falls below 95%, the customer might have the right to terminate the contract without penalty.

The relationship between SLIs, SLOs, and SLAs is hierarchical. SLIs are what you measure. SLOs are what you target internally. SLAs are what you promise externally. The SLA target should always be lower than the SLO target. If your SLO is 99.9% availability, your SLA might be 99.5%. This gives you a buffer. You breach your SLO before you breach your SLA. Breaching your SLO triggers internal action. Breaching your SLA triggers financial consequences.

Here is a real-world example of SLA negotiation. A cloud storage provider was negotiating an SLA with a large enterprise customer. The customer wanted 99.99% availability with a 50% credit for any breach. The provider's current availability was 99.95%. The gap between 99.95% and 99.99% was significant. Going from 99.95% to 99.99% would require eliminating single points of failure, implementing multi-region redundancy, and investing in automated failover. The engineering team estimated it would take 6 months and cost $2 million in infrastructure.

The negotiation went back and forth. The customer ultimately agreed to 99.95% availability with tiered credits: 10% credit for availability below 99.95%, 25% for below 99.9%, and 50% for below 99.5%. The provider accepted 99.95% because it was achievable with their current infrastructure and the credit structure was financially sustainable. The key insight was that the SLA was a business decision informed by engineering data, not a purely technical or purely business decision.

When negotiating SLAs, you need to consider several factors. What is the cost of meeting the target? Going from 99.9% to 99.99% might cost ten times more. Is the customer willing to pay for that additional reliability? What are the financial consequences of breach? If the credit structure is too punitive, you risk financial ruin from a major outage. If it is too lenient, the customer has no assurance that you will prioritize reliability. What are the measurement methodologies? Both parties must agree on how availability is measured, what counts as downtime, and how edge cases are handled.

One important nuance is the difference between availability and uptime. Availability is the proportion of time the service is functioning correctly. Uptime is the total time the service is operational, including degraded states. A service can be "up" but returning errors for some requests. If your SLA measures uptime instead of availability, you might be meeting the SLA while your customers are experiencing significant pain. Always negotiate for availability-based SLAs, not uptime-based SLAs.

## Error Budget Policies in Practice

Error budget policies are the rules that govern how your team responds to error budget status. They are the operational translation of the SLO commitment. Without explicit policies, teams argue about what to do when the error budget is low. With explicit policies, the response is predetermined and automatic.

A well-designed error budget policy has four tiers.

**Tier 1: Budget above 75% (green zone).** The team has significant headroom. All changes are permitted, including high-risk changes like major infrastructure migrations, database schema changes, and new service deployments. This is also the time to invest in chaos engineering, load testing, and technical debt reduction. The team should proactively improve reliability because they have the budget to absorb the risk of improvement activities.

**Tier 2: Budget between 50-75% (yellow zone).** The team has moderate headroom. Low and medium-risk changes are permitted. High-risk changes require approval from the SRE lead. This is a signal that the team is spending more error budget than they are generating. The team should investigate why and start planning reliability improvements, but a full freeze is not yet necessary.

**Tier 3: Budget between 25-50% (orange zone).** The team has limited headroom. Only bug fixes and reliability improvements are permitted. No new features. No infrastructure changes. No experiments. The team must identify the root cause of the error budget consumption and implement fixes. This is a focused reliability sprint.

**Tier 4: Budget below 25% or depleted (red zone).** The team has no headroom. A complete freeze on all changes except critical security patches and reliability improvements. The team must conduct a thorough investigation, implement systemic fixes, and demonstrate that reliability has improved before any non-essential work resumes. In some organizations, this triggers an all-hands reliability review where leadership assesses the situation and allocates additional resources.

Here is a real scenario of error budget policies in action. A fintech company had an SLO of 99.95% for their payment processing API. Their error budget policy had the four tiers described above. In Q2, they shipped a major feature update that included a new payment method and a redesigned checkout flow. The new payment method integration introduced a dependency on a third-party provider that was occasionally slow. This caused p99 latency to spike from 200ms to 2 seconds when the third-party was slow.

The latency spikes consumed error budget rapidly. In the first week of the deployment, they consumed 15 minutes of their 22-minute monthly budget. This triggered the orange zone policy. Feature work on the payment API was frozen. The team investigated and found that the third-party provider had no SLA guaranteeing response times. Their integration had no timeout or circuit breaker.

The fix took two weeks: implement a 500ms timeout on third-party calls, add a circuit breaker that falls back to a queued retry, and implement caching for the third-party's responses. During those two weeks, no new features were shipped for the payment API. Product management was frustrated, but the error budget policy made the decision clear and non-negotiable.

After the fix was deployed, the p99 latency returned to 200ms. The error budget stabilized. Feature work resumed. The total cost was two weeks of delayed feature delivery. The alternative, shipping features with degraded reliability, could have resulted in payment failures, lost revenue, and potential SLA breaches that would have cost far more in credits and customer trust.

## Defining SLOs for a Microservice: A Complete Example

Let me walk through a complete example of defining SLOs for a real microservice. The service is an order management API for an e-commerce platform. It handles order creation, order status queries, order updates, and order cancellation. It serves 500 requests per second at peak, 50 requests per second at minimum.

**Step 1: Identify critical user journeys.**

The four main user journeys are:
- Order creation: customer submits an order
- Order status query: customer checks order status
- Order update: customer modifies an existing order (e.g., change quantity, add item)
- Order cancellation: customer cancels an order

**Step 2: Define SLIs for each journey.**

For order creation:
- Availability: proportion of order creation requests that succeed and return a valid order ID
- Latency: time from request receipt to response with order ID
- Correctness: order is created with the correct items, quantities, and prices

For order status query:
- Availability: proportion of status queries that return the correct status
- Latency: time from request receipt to response with status
- Freshness: status reflects the most recent state (not stale data)

For order update:
- Availability: proportion of update requests that succeed and return the updated order
- Latency: time from request receipt to response with updated order
- Correctness: order is updated to the requested state without data corruption

For order cancellation:
- Availability: proportion of cancellation requests that succeed and confirm cancellation
- Latency: time from request receipt to confirmation response
- Correctness: order is actually cancelled and payment is refunded or not charged

**Step 3: Set initial SLO targets.**

Based on the service's current performance and business requirements:

- Order creation availability: 99.95% (revenue-critical, must be highly available)
- Order creation latency p99: 1 second (customers expect fast checkout)
- Order status query availability: 99.9% (important but not revenue-critical)
- Order status query latency p99: 500ms (queries should be fast)
- Order update availability: 99.9% (important but less frequent)
- Order update latency p99: 1 second (updates are less time-sensitive)
- Order cancellation availability: 99.95% (revenue-impacting, must work)
- Order cancellation latency p99: 2 seconds (cancellation can take slightly longer)

**Step 4: Calculate error budgets.**

For a 30-day month:
- Order creation: 0.05% of 30 days = 21.6 minutes
- Order status query: 0.1% of 30 days = 43.2 minutes
- Order update: 0.1% of 30 days = 43.2 minutes
- Order cancellation: 0.05% of 30 days = 21.6 minutes

**Step 5: Identify monitoring requirements.**

To measure these SLIs, you need:
- Request logging with timestamps for all endpoints
- Latency measurement at the application level (not just network level)
- Error classification (client errors vs server errors vs timeouts vs application errors)
- Success validation (not just HTTP 200, but checking response body for correctness)
- Database query logging for correctness verification

**Step 6: Establish alerting.**

Alert when the SLI is trending toward SLO breach. Do not alert when the SLO is breached; that is too late. Set alerts at 50% of the error budget consumed. For order creation with a 21.6-minute monthly budget, alert when 10.8 minutes of budget have been consumed. This gives the team time to investigate and fix before the SLO is breached.

The alert should fire when the rolling 1-hour error rate exceeds the threshold that, if sustained, would consume the monthly budget. For order creation at 99.95%, a 1-hour window with 0.05% errors means 1.8 seconds of errors in that hour. If the 1-hour error rate exceeds 0.05%, the alert fires.

**Step 7: Document and communicate.**

Write up the SLOs in a document that is accessible to the entire team. Include the SLO targets, the error budgets, the error budget policies, and the escalation procedures. Share this document with product management, customer success, and support. Make sure everyone understands what the SLOs mean and what happens when they are breached.

The goal of this documentation is not to create bureaucracy. It is to create shared understanding. When product management wants to ship a new feature, they should know that the order creation SLO has a tight error budget and the feature must be thoroughly tested. When support receives a customer complaint about order creation failures, they should know the SLO and whether the current error budget status indicates a systemic problem.

## SLI Accuracy and Common Pitfalls

Getting SLIs right is harder than it looks. There are several common pitfalls that teams encounter.

**Pitfall 1: Measuring at the wrong layer.** If you measure availability at the load balancer level, you will see 100% availability as long as the backend returns any response, including 500 errors. You need to measure at the application level, checking both the HTTP status code and the response body.

**Pitfall 2: Ignoring partial failures.** If a request returns a 200 OK but includes a note that "some items are unavailable," that is a partial failure. If a request returns a 200 OK but takes 30 seconds, that is a degraded experience. Your SLI should capture these cases.

**Pitfall 3: Using averages instead of percentiles.** As discussed in Module 1, averages hide the distribution. If your average latency is 100ms but your p99 is 5 seconds, your SLI based on averages looks great while 1% of your users are having a terrible experience.

**Pitfall 4: Not accounting for retries.** If a client retries failed requests, the retry might succeed. Your SLI might show 99.9% availability (only 0.1% of requests fail), but the user experienced a much worse rate because many of those "successful" requests were retries after initial failures. Measure at the user journey level, not the individual request level.

**Pitfall 5: SLIs that are too complex.** If your SLI requires joining data from five different monitoring systems and running a complex calculation, you will not be able to check it quickly during an incident. Keep SLIs simple enough that an on-call engineer can verify them in under 5 minutes.

**Pitfall 6: SLIs that are too simple.** If your only SLI is "HTTP 200 responses," you are missing a lot. A service can return HTTP 200 with incorrect data, stale data, or incomplete data. Your SLIs should be simple enough to be practical but comprehensive enough to reflect the user's actual experience.

The best SLIs are derived from the user's perspective. Ask: "if I were a user of this service, what would I care about?" The answer is usually: "does it work, is it fast, and is it correct." Your SLIs should measure exactly those three things.

## Assessment

**Lab 1: SLI Implementation (60 minutes)**

You are given a microservice with three endpoints: `/search` (queries a search index), `/submit` (submits a form), and `/status` (returns processing status). The service has basic monitoring but no SLI implementation.

Tasks:
1. Implement availability SLIs for all three endpoints. Your SLI must check HTTP status code AND validate the response body contains expected fields.
2. Implement latency SLIs measuring p50, p95, and p99 for all three endpoints.
3. Build a dashboard that shows all SLIs for all three endpoints in a single view.
4. Write a script that calculates the current SLI values over the past 24 hours.
5. Identify and document at least three cases where the SLI would give a misleading result (edge cases).

Grading criteria:
- SLIs correctly measure both HTTP status and response body correctness (25 points)
- Latency percentiles are correctly calculated and displayed (20 points)
- Dashboard is clear, organized, and shows all SLIs (20 points)
- 24-hour SLI calculation script works correctly (15 points)
- Edge cases are correctly identified and documented (20 points)

**Lab 2: SLO Definition Workshop (45 minutes)**

You are given monitoring data for a real service over the past 30 days. The data includes latency distributions, error rates, and throughput for 8 endpoints. Three of these endpoints are critical user journeys.

Tasks:
1. Identify the three critical user journeys from the data.
2. Propose SLIs for each critical journey.
3. Set SLO targets for each SLI. Justify each target with data from the monitoring output.
4. Calculate error budgets for each SLO.
5. Propose an error budget policy with at least three tiers.
6. Write a one-page document that presents these SLOs to a non-technical stakeholder.

Grading criteria:
- Critical user journeys correctly identified with justification (15 points)
- SLO targets are achievable but meaningful (25 points)
- Error budget calculations are correct (15 points)
- Error budget policy is practical and clear (15 points)
- Non-technical document is clear and avoids jargon (30 points)

**Lab 3: SLA Analysis (30 minutes)**

You are given two real-world SLA documents from different cloud providers (provided as PDFs or HTML). Compare and contrast them.

Tasks:
1. Identify the SLIs used in each SLA.
2. Compare the measurement methodologies.
3. Compare the target levels.
4. Compare the remedy structures (service credits).
5. Identify any ambiguities or loopholes in each SLA.
6. Propose improvements to each SLA from the customer's perspective.

Grading criteria:
- SLIs correctly identified (15 points)
- Measurement methodology comparison is thorough (20 points)
- Target level comparison is accurate (15 points)
- Remedy structure comparison is complete (15 points)
- Ambiguities are correctly identified (20 points)
- Proposed improvements are practical (15 points)
