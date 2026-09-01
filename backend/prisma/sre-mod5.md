# Module 5: Capacity Planning

## Why Capacity Planning Matters

Capacity planning is the discipline of ensuring your infrastructure has enough resources to handle current and future demand. It sounds straightforward, but it is one of the most commonly neglected SRE practices. Teams focus on keeping the lights on today and forget to prepare for tomorrow. Then Black Friday arrives, a marketing campaign goes viral, or a competitor's outage drives their users to your platform, and your infrastructure falls over under the unexpected load.

The cost of insufficient capacity is obvious: outages, degraded performance, lost revenue, and damaged reputation. But the cost of excess capacity is also real: wasted money on servers that sit idle, increased complexity from over-provisioned infrastructure, and higher energy costs. The goal of capacity planning is to find the right balance: enough capacity to handle expected demand with a reasonable safety margin, without paying for resources you do not need.

Capacity planning operates on three time horizons. Long-term (6-12 months) planning addresses major infrastructure investments: new data centers, cloud regions, or hardware purchases. Medium-term (1-3 months) planning addresses seasonal variations: Black Friday, end-of-quarter processing, marketing campaigns. Short-term (1-4 weeks) planning addresses immediate needs: a new feature launch, a traffic spike from a product launch, or a migration that doubles resource usage.

## Forecasting Techniques

Forecasting is the foundation of capacity planning. You need to predict future demand to ensure you have enough capacity to handle it. There are several forecasting techniques, each with different strengths and weaknesses.

**Linear extrapolation** is the simplest technique. You look at the trend line of your traffic over the past 3-6 months and extend it forward. If your traffic has been growing at 5% per month, you project that it will be 5% higher next month. This works well for services with steady, predictable growth. It does not work well for services with seasonal patterns, viral spikes, or sudden growth from new features.

**Seasonal decomposition** accounts for periodic patterns in your traffic. Many services have daily patterns (peak during business hours, trough at night), weekly patterns (higher on weekdays, lower on weekends), and annual patterns (higher during holidays, lower in summer). By decomposing your traffic into these components, you can forecast future demand more accurately. For example, if your traffic is typically 30% higher in December than November, and your traffic has been growing at 5% per month, you forecast December traffic as November traffic multiplied by 1.05 (growth) multiplied by 1.30 (seasonality).

**Regression analysis** uses statistical models to predict future traffic based on multiple factors. Instead of just looking at time, you incorporate other variables: marketing spend, user growth rate, feature launches, and external events. A regression model might predict that a $100,000 marketing campaign will drive 20,000 additional daily active users, which will increase API calls by 15%. This gives you a more nuanced forecast than simple extrapolation.

**Event-based forecasting** focuses on specific events that will drive traffic. A product launch, a marketing campaign, a seasonal sale, or a competitor's outage. For these events, you cannot rely on historical trends because the event is novel. Instead, you estimate the traffic impact based on similar past events or market research. For example, if your last product launch drove a 3x traffic spike for 48 hours, you plan for a 3x spike for the next launch.

**Queue-based forecasting** is useful for batch processing systems. Instead of forecasting request rates, you forecast queue depths. If your batch processing system processes 10,000 jobs per hour and you expect 50,000 jobs from a new data source, you need capacity to process those additional jobs within the required time window.

Here is a real forecasting example. A SaaS company was preparing for their busiest quarter. Their platform served enterprise customers who renewed contracts in Q4 and Q1. Historical data showed that Q4 traffic was typically 40% higher than Q3. Additionally, the company had signed 20 new enterprise customers who would go live in Q4. Each new customer was expected to generate traffic proportional to their employee count. The forecasting model combined seasonal patterns (40% Q4 increase) with customer-driven growth (each new customer adding approximately 5% to base traffic). The total forecast was a 140% increase in Q4 traffic compared to Q3. This forecast drove the capacity planning decisions for the quarter.

## Load Testing: k6 and Locust

Load testing is the practice of simulating production traffic against your infrastructure to measure its capacity limits. You generate artificial traffic that mimics real user behavior and gradually increase the load until the system degrades. The point at which the system degrades is its capacity limit. Knowing this limit is essential for capacity planning.

**k6** is a modern load testing tool written in JavaScript. It is designed for developer productivity and integrates well with CI/CD pipelines. Here is a basic k6 script that tests an API endpoint:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  let res = http.get('https://api.example.com/orders');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

This script ramps up to 100 concurrent users over 2 minutes, maintains that load for 5 minutes, ramps to 200 users, maintains for 5 minutes, and ramps down. At each stage, it checks that responses are HTTP 200 and latency is under 500ms.

k6 supports several load test types:

**Load testing** is the most common. You simulate expected production traffic and verify that the system handles it within SLO bounds. If your production traffic is 1,000 requests per second, you generate 1,000 requests per second and verify latency and error rates.

**Stress testing** pushes beyond expected traffic to find the breaking point. You gradually increase load until the system fails. This tells you how much headroom you have. If your system handles 5,000 requests per second before degrading, and your expected traffic is 1,000, you have 5x headroom.

**Soak testing** runs at expected traffic levels for an extended period (hours or days). This reveals issues that only appear over time: memory leaks, connection pool exhaustion, disk space filling up, and log rotation failures.

**Spike testing** simulates sudden traffic spikes. You go from zero to maximum load instantly. This tests how quickly the system scales and whether it can handle sudden demand increases.

**Locust** is another popular load testing tool written in Python. It uses a different programming model than k6. Instead of JavaScript scripts, you define user behavior in Python classes. Here is a basic Locust example:

```python
from locust import HttpUser, task, between

class OrderUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def get_orders(self):
        self.client.get("/api/orders")

    @task(1)
    def create_order(self):
        self.client.post("/api/orders", json={
            "item": "widget",
            "quantity": 1
        })
```

Locust's advantage is that it is written in Python, which many data engineers and SREs already know. It also has a web UI that shows real-time load test results. k6's advantage is performance: it can generate more load with fewer resources because it is written in Go.

The key output of a load test is the capacity curve. This is a graph that shows how latency and error rates change as load increases. At low load, latency is low and errors are zero. As load increases, latency increases gradually. At some point, latency increases sharply (the "knee" of the curve). Beyond the knee, the system degrades rapidly. The knee is your practical capacity limit. You should plan your capacity so that your expected peak load is well below the knee.

Here is a real load testing scenario. An e-commerce company was preparing for Black Friday. They expected 10x normal traffic. Their current infrastructure handled 5,000 requests per second comfortably. They needed to handle 50,000 requests per second.

They ran a stress test using k6. The results showed:
- 5,000 req/s: p99 latency 150ms, 0% errors
- 10,000 req/s: p99 latency 200ms, 0% errors
- 20,000 req/s: p99 latency 400ms, 0% errors
- 30,000 req/s: p99 latency 800ms, 0.1% errors (knee)
- 40,000 req/s: p99 latency 2,000ms, 2% errors
- 50,000 req/s: p99 latency 5,000ms, 15% errors

The knee was at 30,000 requests per second. The system could technically handle 50,000 req/s but with unacceptable latency and errors. The capacity planning conclusion was clear: the infrastructure needed to be scaled to handle at least 50,000 req/s with p99 latency under 500ms. This meant roughly doubling the current infrastructure.

The team scaled up their Kubernetes cluster from 50 to 120 nodes, added 10 more PostgreSQL read replicas, increased Redis cluster capacity, and added CDN coverage for static assets. They re-ran the load test and confirmed that the scaled infrastructure could handle 60,000 req/s with p99 latency under 300ms. On Black Friday, the actual peak was 45,000 req/s. The infrastructure handled it with room to spare.

## Resource Optimization

Capacity planning is not just about adding resources. It is also about using existing resources more efficiently. Over-provisioned infrastructure wastes money. Under-provisioned infrastructure causes outages. The goal is right-sized infrastructure that matches actual demand.

**Vertical scaling** means increasing the resources of individual machines: more CPU, more RAM, more disk. This is simple but has limits. There is a maximum machine size, and larger machines are not always cost-effective. Vertical scaling also does not help with availability: a single large machine is a single point of failure.

**Horizontal scaling** means adding more machines to handle increased load. This is more complex (you need load balancing, session management, and distributed data stores) but more flexible. You can scale incrementally, and the failure of a single machine does not bring down the entire system.

**Auto-scaling** is horizontal scaling driven by metrics. When CPU utilization exceeds 70%, add more machines. When it drops below 30%, remove machines. Auto-scaling is the most cost-effective approach because it matches capacity to demand in real time. But it has a lag: it takes time for new machines to start handling traffic. If your traffic spikes faster than your auto-scaler can react, you will have a period of degraded performance.

**Right-sizing** is the process of matching machine sizes to actual usage. If a machine is consistently using 10% of its CPU and 20% of its RAM, it is over-provisioned. You can downsize it to a smaller, cheaper machine. If a machine is consistently using 90% of its CPU, it is under-provisioned. You need to upsize it or add more machines. Right-sizing is typically done with cloud provider tools (AWS Compute Optimizer, GCP Recommender) or third-party tools (Spot.io, ParkMyCloud).

**Reserved instances and committed use discounts** are pricing models that reduce cloud costs in exchange for long-term commitments. If you know you will need 100 instances for the next year, you can commit to using them for a year (reserved instances) or three years (committed use discounts) in exchange for a 30-60% discount. This is a capacity planning decision: you are betting that your capacity needs will remain stable over the commitment period.

Here is a real resource optimization example. A company was spending $50,000 per month on AWS infrastructure. They conducted a resource optimization review and found:

- 30% of their EC2 instances were consistently under-utilized (less than 20% CPU). Downsizing these instances saved $8,000 per month.
- They were not using reserved instances for their steady-state workloads. Switching to reserved instances saved $12,000 per month.
- Their development and staging environments were running 24/7 but were only used during business hours. Implementing auto-scaling schedules saved $5,000 per month.
- Their S3 buckets had no lifecycle policies. Old log files were stored in expensive S3 Standard storage. Moving them to S3 Glacier saved $2,000 per month.

Total savings: $27,000 per month, or $324,000 per year. The optimization effort took two weeks of engineering time. The ROI was achieved in less than one month.

## Preparing for Black Friday: A Complete Scenario

Let me walk through a complete Black Friday preparation scenario for an e-commerce company. The company expects 10x normal traffic on Black Friday, with peak traffic occurring between 6 AM and 2 PM EST.

**Phase 1: Demand forecasting (8 weeks before Black Friday).**

The team analyzes historical Black Friday data, marketing plans, and customer growth projections. They determine:
- Normal daily traffic: 5 million page views, 1 million API requests per minute at peak
- Expected Black Friday traffic: 50 million page views, 10 million API requests per minute at peak
- Expected peak duration: 8 hours (6 AM - 2 PM EST)
- Expected traffic ramp: 3x normal by 6 AM, 10x normal by 8 AM, sustained until 2 PM, then gradual decline

**Phase 2: Load testing and capacity assessment (6 weeks before).**

The team runs stress tests using k6 against their production-like staging environment. Results show:
- Current infrastructure handles 3 million API requests per minute before the knee
- At 5 million requests per minute, p99 latency exceeds 2 seconds
- The database is the primary bottleneck: PostgreSQL read replicas hit 90% CPU at 4 million requests per minute
- The CDN handles static assets well but is not configured for API response caching

**Phase 3: Infrastructure scaling (4 weeks before).**

Based on the load test results, the team scales up:
- Kubernetes cluster: 50 nodes to 150 nodes (3x)
- PostgreSQL: 3 read replicas to 10 read replicas
- Redis: 3-node cluster to 9-node cluster
- CDN: added API response caching for product catalog and search results
- Load balancers: upgraded from m5.large to m5.xlarge instances
- Auto-scaling: configured to scale from 100 to 200 nodes within 5 minutes

Total infrastructure cost increase: approximately $40,000 for the month (including the scaling period before and after Black Friday).

**Phase 4: Application optimization (3 weeks before).**

The team identifies and fixes several performance bottlenecks:
- Product catalog queries: added a caching layer that reduces database queries by 80%
- Search functionality: optimized Elasticsearch queries that were doing full index scans
- Image serving: moved product images to a CDN with aggressive caching
- API response compression: enabled gzip compression for API responses, reducing bandwidth by 60%

**Phase 5: Operational readiness (2 weeks before).**

The team prepares for the event operationally:
- Extra on-call engineers are scheduled for Black Friday (double the normal rotation)
- War room is set up with dashboards, communication channels, and escalation contacts
- Rollback procedures are documented and tested for every change
- Customer support is briefed on expected issues and escalation paths
- Marketing is briefed on the capacity limits (e.g., "if we get more than 15 million API requests per minute, we may need to throttle")

**Phase 6: Final validation (1 week before).**

The team runs a final load test against the scaled production environment. Results:
- 10 million API requests per minute: p99 latency 250ms, 0% errors
- 15 million API requests per minute: p99 latency 400ms, 0% errors (this is the safety limit)
- 20 million API requests per minute: p99 latency 1,200ms, 0.5% errors (beyond the safety limit)

The infrastructure is ready.

**Phase 7: Black Friday execution.**

Black Friday arrives. The team monitors dashboards from 5 AM. Traffic ramps as expected: 3x by 6 AM, 7x by 7 AM, 10x by 8 AM. Peak traffic hits 12 million API requests per minute at 9 AM. This is 20% above the forecast. The infrastructure handles it: p99 latency is 300ms, error rate is 0.01%. The team breathes a sigh of relief.

At 11 AM, a surge drives traffic to 14 million API requests per minute. The auto-scaler kicks in and adds 30 more nodes. The infrastructure absorbs the surge. p99 latency briefly spikes to 450ms but returns to 300ms after the auto-scaler completes.

By 2 PM, traffic starts declining. By 4 PM, it is back to 3x normal. The team scales down the infrastructure over the next week, returning to normal capacity.

**Post-mortem:**

The Black Friday preparation was a success. Key metrics:
- Zero downtime during the event
- p99 latency stayed under 500ms for the entire event
- Error rate stayed under 0.05%
- Infrastructure scaled automatically without manual intervention
- Total additional cost was $45,000 (within the $40,000 budget, with slight overage due to the higher-than-expected peak)

Lessons learned:
- The demand forecast was 20% low. Future forecasts should include a larger safety margin.
- The auto-scaler took 3 minutes to react to the 11 AM surge. Pre-scaling before the expected peak would have been better.
- The CDN caching for API responses reduced database load significantly. This should be a standard practice, not just a Black Friday optimization.

## Cost Optimization in Capacity Planning

Capacity planning is not just about having enough resources. It is also about not wasting money on resources you do not need. Cloud computing has made capacity planning both easier and harder. Easier because you can scale up and down on demand. Harder because the pricing models are complex and the costs can spiral quickly if you are not careful.

**Reserved instances vs. on-demand.** If you know you will need a specific instance type for the next year, reserved instances save 30-60% compared to on-demand pricing. The risk is that your needs change and you are stuck paying for instances you no longer use. The mitigation is to reserve only your baseline capacity (the minimum you know you will always need) and use on-demand for variable capacity (the extra resources you need during peaks).

**Spot instances.** Cloud providers offer unused capacity at steep discounts (60-90% off on-demand prices). The catch is that the provider can reclaim the instances with short notice (typically 2 minutes). Spot instances are ideal for fault-tolerant workloads: batch processing, CI/CD pipelines, and stateless web servers that can be replaced quickly. They are not suitable for databases or stateful services that cannot tolerate sudden termination.

**Right-sizing.** As discussed earlier, right-sizing involves matching instance types to actual usage. A common pattern is to start with a general-purpose instance, measure the actual resource utilization, and then switch to a compute-optimized, memory-optimized, or storage-optimized instance that better matches the workload. For example, a JVM application that uses 4GB of heap memory but only 10% CPU does not need a general-purpose m5.xlarge (4 vCPU, 16GB RAM). It needs a memory-optimized r5.large (2 vCPU, 16GB RAM) at half the cost.

**Auto-scaling policies.** Auto-scaling saves money by removing instances when they are not needed. But poorly configured auto-scaling can waste money. If your scale-up threshold is too low, you scale up unnecessarily. If your scale-down threshold is too high, you scale down too aggressively and then scale up again, creating a thrashing pattern. The key is to set thresholds with appropriate hysteresis: scale up when CPU exceeds 70%, scale down when CPU drops below 30%, and require the metric to remain at the new level for at least 10 minutes before scaling.

A real cost optimization example. A SaaS company was spending $80,000 per month on AWS. They conducted a cost optimization review and found:
- 40% of their EC2 instances were over-provisioned. Right-sizing saved $15,000 per month.
- They were not using reserved instances for their baseline capacity. Switching to reserved instances saved $18,000 per month.
- Their CI/CD pipeline was running on on-demand instances. Switching to spot instances saved $6,000 per month.
- Their auto-scaling was too aggressive. Tuning the thresholds saved $4,000 per month.

Total savings: $43,000 per month, or $516,000 per year. The optimization effort took three weeks of engineering time. The ROI was achieved in less than one month.

The key lesson is that cost optimization is a continuous discipline, not a one-time project. As your workload changes, your optimal infrastructure configuration changes. Regular cost reviews (quarterly at minimum) ensure that you are not paying for resources you do not need.

## Assessment

**Lab 1: Load Test Design and Execution (90 minutes)**

You are given a web application with three endpoints: `/products` (product catalog, read-heavy), `/cart` (shopping cart, write-heavy), and `/checkout` (payment processing, critical). The application is deployed to Kubernetes.

Tasks:
1. Design a load test plan that covers all three endpoints with realistic traffic patterns.
2. Implement the load test using k6 or Locust.
3. Execute the load test and identify the capacity limit (knee) for each endpoint.
4. Create a capacity curve for each endpoint showing latency and errors vs. load.
5. Based on the capacity curves, recommend infrastructure scaling for a 5x traffic increase.
6. Write a report summarizing the findings and recommendations.

Grading criteria:
- Load test plan covers all endpoints with realistic patterns (15 points)
- Load test implementation is correct and well-structured (20 points)
- Capacity limits are correctly identified (20 points)
- Capacity curves are accurate and clearly presented (15 points)
- Scaling recommendations are practical and justified (20 points)
- Report is clear and actionable (10 points)

**Lab 2: Capacity Forecasting (45 minutes)**

You are given 12 months of historical traffic data for a SaaS platform. The data includes daily active users, API requests per day, and bandwidth usage.

Tasks:
1. Identify the daily, weekly, and seasonal patterns in the data.
2. Forecast traffic for the next 3 months using at least two different techniques.
3. Compare the forecasts and explain which is more reliable and why.
4. Identify the capacity limit based on current infrastructure and the forecasted traffic.
5. Recommend infrastructure changes to meet the forecasted demand.

Grading criteria:
- Patterns correctly identified (15 points)
- Forecasts are mathematically sound (25 points)
- Comparison of techniques is thoughtful (20 points)
- Capacity limit is correctly identified (20 points)
- Recommendations are practical (20 points)

**Lab 3: Resource Optimization (30 minutes)**

You are given a cloud infrastructure bill for a production environment. The bill includes instance types, utilization metrics, and costs.

Tasks:
1. Identify over-provisioned instances (less than 30% average CPU utilization).
2. Recommend right-sizing changes (specific instance types to downsize to).
3. Calculate the monthly cost savings from right-sizing.
4. Identify opportunities for reserved instances (steady-state workloads running >70% of the time).
5. Calculate the total annual savings from all optimizations.

Grading criteria:
- Over-provisioned instances correctly identified (25 points)
- Right-sizing recommendations are valid (25 points)
- Cost calculations are accurate (25 points)
- Reserved instance recommendations are sound (25 points)
