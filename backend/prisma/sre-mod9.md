# Module 9 — Chaos Engineering

## Chaos Monkey Principles

Chaos engineering is the discipline of experimenting on a system to build confidence in its ability to withstand turbulent conditions in production. The name comes from Netflix's Chaos Monkey, a tool that randomly terminates virtual machine instances in production to ensure that services can tolerate failures gracefully.

The core principle of chaos engineering is that failures will happen. Networks will partition. Servers will crash. Disks will fill up. Dependencies will become unavailable. Instead of waiting for these failures to happen randomly and discovering that your system cannot handle them, you deliberately inject failures to test your system's resilience before they occur naturally.

Chaos engineering is not about breaking things for fun. It is about systematically identifying weaknesses in your system before they cause outages. The experiments are designed to answer specific questions: "what happens when the database goes down?" "what happens when a service becomes slow?" "what happens when a network partition occurs?" The answers to these questions tell you whether your system is resilient and where the weaknesses are.

The four principles of chaos engineering, as defined by Netflix, are:

**Principle 1: Build a hypothesis around steady-state behavior.** Before you inject a failure, define what "normal" looks like. What are the golden signals for the service you are testing? What is the expected behavior under normal conditions? The hypothesis is: "under normal conditions, the service processes 1,000 requests per second with p99 latency under 200ms and 0% errors." If the failure injection does not significantly change this behavior, the system is resilient. If it does, you have found a weakness.

**Principle 2: Vary real-world events.** The failures you inject should resemble real-world failures. Do not just terminate random processes. Simulate network partitions, disk failures, CPU exhaustion, memory leaks, and dependency outages. These are the failures that actually happen in production, and they have different characteristics. A network partition is different from a server crash. A slow dependency is different from a dead dependency.

**Principle 3: Run experiments in production.** Staging environments do not replicate production. They have different traffic patterns, different data volumes, and different infrastructure configurations. An experiment that passes in staging might fail in production. The only way to build confidence in production resilience is to test in production. This requires careful experiment design: start small, have automated rollback, and ensure the experiment does not cause a customer-impacting outage.

**Principle 4: Automate experiments to run continuously.** One-off experiments provide a snapshot in time. Systems change constantly: new code, new dependencies, new traffic patterns. An experiment that passes today might fail next month after a code change. Automating experiments and running them continuously ensures that resilience is maintained as the system evolves.

Here is a real example of Chaos Monkey principles in practice. A streaming service had a recommendation engine that depended on three microservices: user profile, content catalog, and viewing history. The team wanted to know what happened if the viewing history service became slow.

**Steady-state hypothesis:** Under normal conditions, the recommendation engine serves 500 requests per second with p99 latency under 300ms and returns personalized recommendations for 99% of requests.

**Experiment design:** Inject a 500ms delay into the viewing history service's responses. This simulates a slow dependency, which is a common real-world failure.

**Expected outcome:** If the recommendation engine is resilient, it should handle the slow dependency gracefully: either by using cached data, falling back to generic recommendations, or degrading gracefully. If it is not resilient, the recommendation engine's latency will increase proportionally, and it will eventually time out and fail.

**Actual outcome:** The recommendation engine's p99 latency increased from 300ms to 2,500ms. The engine was making synchronous calls to the viewing history service with no timeout. When the viewing history service slowed down, the recommendation engine's thread pool exhausted, causing cascading failures.

**Finding:** The recommendation engine was not resilient to slow dependencies. The fix was to add a 200ms timeout on the viewing history call, implement a circuit breaker, and cache the viewing history data for 5 minutes.

## GameDay Exercises

A GameDay exercise is a planned, coordinated simulation of a major incident. Unlike chaos experiments that test individual failure modes, a GameDay tests the entire incident response process: detection, communication, escalation, mitigation, and recovery. The goal is to practice being in an incident so that when a real incident occurs, the team knows what to do.

A GameDay exercise typically includes several components.

**Scenario design.** The GameDay organizer designs a realistic failure scenario. The scenario should be complex enough to require coordination across multiple teams, but not so complex that it is impossible to resolve within the exercise time limit. Common scenarios include: a region outage (one of your cloud regions goes down), a database failure (primary database becomes unavailable), a dependency failure (a critical external service becomes unavailable), and a cascading failure (one failure triggers a chain of other failures).

**Participants.** The GameDay includes everyone who would be involved in a real incident: on-call engineers, incident commanders, communications leads, and management. The participants do not know the scenario in advance. They discover the failure as it "happens" during the exercise.

**Execution.** The GameDay organizer injects the failure at a planned time. The participants respond as they would in a real incident: they detect the failure (through monitoring alerts), assess the severity, communicate status, investigate the root cause, and implement mitigation. The organizer observes and documents the response.

**Debrief.** After the exercise, the team conducts a debrief to discuss what went well, what could be improved, and what gaps were identified. The debrief should be blameless: the goal is to improve the process, not to criticize individuals.

Here is a real GameDay exercise scenario. A fintech company conducted a GameDay to test their region failover capability. The scenario was: the primary AWS region (us-east-1) becomes unavailable, and all traffic must be failed over to the secondary region (us-west-2).

The exercise proceeded as follows:

- T+0: The organizer announced "us-east-1 is unavailable. All services in this region are unreachable."
- T+2 minutes: The monitoring system detected the failure and fired alerts. The on-call engineer acknowledged the alerts.
- T+5 minutes: The on-call engineer began investigating. They confirmed that all services in us-east-1 were unreachable.
- T+10 minutes: The on-call engineer escalated to the secondary on-call and the engineering manager. A war room was opened.
- T+15 minutes: The team began the region failover process. DNS records were updated to point to us-west-2.
- T+25 minutes: The DNS propagation was complete. Traffic was flowing to us-west-2.
- T+30 minutes: The team verified that all services were operating normally in us-west-2.
- T+35 minutes: The team confirmed that all data was consistent (no data loss during the failover).
- T+40 minutes: The exercise was concluded.

The GameDay revealed several issues:

1. The DNS TTL was set to 300 seconds (5 minutes), which meant some clients continued to send traffic to us-east-1 for up to 5 minutes after the DNS change. The team reduced the TTL to 60 seconds.
2. The failover process required manual DNS changes. The team automated the failover using Route 53 health checks and failover routing policies.
3. The team was not sure whether all data had been replicated to us-west-2. The team implemented continuous replication monitoring and alerting.
4. The war room communication was chaotic because multiple people were talking at once. The team established a protocol that only the incident commander speaks during status updates.

The GameDay was a success. It identified real weaknesses in the failover process, and the team fixed them before a real region outage occurred.

## Failure Injection Techniques

Failure injection is the practice of deliberately introducing failures into a system to test its resilience. There are several types of failure injection, each targeting a different component of the system.

**Network failure injection.** Simulates network issues: latency, packet loss, partitions, and DNS failures. Tools like `tc` (traffic control) on Linux can add latency and packet loss to network interfaces. Chaos mesh and Litmus can inject network failures in Kubernetes environments.

**Resource failure injection.** Simulates resource exhaustion: CPU throttling, memory pressure, disk full, and file descriptor exhaustion. Tools like `stress-ng` can generate CPU and memory load. Chaos mesh can inject resource failures in Kubernetes environments.

**Process failure injection.** Simulates process crashes and restarts. Chaos Monkey randomly terminates processes. This tests whether your service can handle the loss of individual instances without degradation.

**Dependency failure injection.** Simulates failures in external dependencies: databases, caches, message queues, and third-party APIs. Tools like Toxiproxy can add latency and errors to network connections. This tests whether your service degrades gracefully when dependencies fail.

**Time failure injection.** Simulates time-related issues: clock skew, time zone changes, and leap seconds. This tests whether your service handles time-related edge cases correctly.

Here is a real failure injection example. A company used Toxiproxy to test the resilience of their order processing service to database failures. They injected several failure scenarios:

**Scenario 1: Database latency.** Added 500ms latency to all database connections. Result: the order processing service's p99 latency increased from 100ms to 600ms. Finding: the service was making synchronous database calls with no timeout. Fix: added a 200ms timeout and implemented connection pooling.

**Scenario 2: Database unavailability.** Terminated the database connection for 30 seconds. Result: the order processing service returned HTTP 503 errors for all requests during the 30-second window. Finding: the service had no fallback mechanism. Fix: implemented a circuit breaker that returns a cached response when the database is unavailable.

**Scenario 3: Database replication lag.** Added 5 seconds of lag to the read replica. Result: the order processing service returned stale data for up to 5 seconds. Finding: the service was reading from the replica without checking for replication lag. Fix: added a lag check that falls back to the primary if the replica lag exceeds 1 second.

Each failure injection revealed a real weakness in the system. The cumulative effect of the fixes was a dramatically more resilient order processing service.

## Chaos Engineering in Production

Running chaos experiments in production requires careful planning and safeguards. The goal is to learn about your system's resilience without causing customer-impacting outages.

**Blast radius control.** Limit the scope of the experiment. If you are testing the resilience of a single service, do not inject failures that could affect other services. If you are testing a specific failure mode, limit the experiment to a single instance or a small percentage of traffic.

**Automated rollback.** Every experiment should have an automated rollback mechanism. If the experiment causes an unexpected cascading failure, the system should automatically revert the injected failure. This requires monitoring the experiment's impact in real time and having clear abort criteria.

**Time-boxing.** Set a maximum duration for each experiment. If the experiment has not completed within the time limit, automatically revert the failure and investigate offline. This prevents experiments from running indefinitely if something goes wrong.

**Communication.** Notify the team before starting a chaos experiment. Post in a dedicated Slack channel that a chaos experiment is in progress. This prevents false alarms and ensures that on-call engineers are not paged for failures that are intentionally injected.

**Monitoring.** During the experiment, monitor the four golden signals for the affected service and any dependent services. If the error rate exceeds a threshold (e.g., 5% of requests), automatically abort the experiment.

Here is a real production chaos engineering example. A SaaS company runs a weekly chaos experiment on their notification service. The experiment injects a 2-second latency into the Redis cache. The experiment is limited to 5% of traffic and runs for 30 minutes.

The experiment revealed that when the cache is slow, the notification service falls back to the database. But the database was not configured to handle the additional load from cache misses. The database connection pool exhausted, causing cascading failures. The experiment was automatically aborted after 5 minutes (the error rate exceeded the 5% threshold).

The finding was valuable: the notification service's fallback mechanism was not resilient to database load. The fix was to implement a secondary cache (a local in-memory cache) that would absorb the load when Redis is slow. The next week's experiment confirmed that the fix worked: when Redis is slow, the notification service uses the local cache, and the database is not affected.

The key lesson is that chaos experiments in production are safe when they are properly scoped, monitored, and automated. The value of the findings far outweighs the risk of the experiments.

## Building a Chaos Engineering Program

Building a chaos engineering program requires maturity. You cannot go from zero to production chaos experiments overnight. Here is a practical roadmap.

**Month 1-2: tabletop exercises.** Gather the team and walk through failure scenarios on paper. "What would happen if the database went down?" "What would happen if a network partition occurred?" These exercises identify obvious gaps without any risk. They also build the muscle of thinking about failure modes.

**Month 3-4: staging experiments.** Run chaos experiments in a staging environment. Use tools like Chaos Mesh or Litmus to inject failures. Test the most critical failure modes identified in the tabletop exercises. This builds confidence in the experiment process and identifies staging-specific gaps.

**Month 5-6: limited production experiments.** Run chaos experiments in production with strict safeguards. Start with low-risk experiments: terminate a single non-critical instance, add latency to a non-critical dependency. Monitor the results and expand gradually.

**Month 7-12: automated continuous experiments.** Automate the experiments and run them continuously. Integrate experiments into the CI/CD pipeline: before deploying a new version, run a set of chaos experiments to verify that the new version is resilient.

The most important principle is to start small and expand gradually. Do not attempt production chaos engineering on day one. Build up to it through tabletop exercises, staging experiments, and limited production experiments. Each phase builds confidence and identifies gaps.

## Measuring Resilience

Chaos engineering is not just about injecting failures. It is about measuring your system's resilience and tracking improvements over time. Without measurement, you cannot determine whether your chaos experiments are making your system more resilient or just causing disruption.

**Resilience score.** A resilience score is a composite metric that summarizes how well your system handles failures. It is calculated by running a set of chaos experiments and measuring the impact of each experiment on the system's golden signals. A system that maintains its SLOs during all experiments has a high resilience score. A system that degrades significantly during experiments has a low resilience score.

Here is a practical resilience scoring framework. Define a set of 10 chaos experiments that cover the most common failure modes: process crash, network latency, network partition, CPU exhaustion, memory pressure, disk full, database unavailability, cache unavailability, dependency failure, and DNS failure. For each experiment, measure the impact on the system's error rate and latency. Score each experiment on a scale of 0-4:
- 0: Complete outage (error rate exceeds 50%)
- 1: Severe degradation (error rate exceeds 10%)
- 2: Moderate degradation (error rate exceeds 1%)
- 3: Mild degradation (error rate exceeds 0.1%)
- 4: No degradation (error rate remains within SLO)

The resilience score is the average across all experiments. A score of 3.5 or above is considered resilient. A score below 2.5 indicates significant resilience gaps.

**Trend tracking.** Run the same set of chaos experiments monthly and track the resilience score over time. If the score is increasing, your resilience is improving. If it is decreasing, your resilience is degrading (perhaps due to new code that introduced weaknesses). Trend tracking provides objective evidence of whether your chaos engineering program is effective.

**Blast radius measurement.** During a chaos experiment, measure the blast radius: the proportion of users or requests affected by the injected failure. A well-designed system should have a small blast radius. If terminating a single instance causes a 50% error rate, the system has a large blast radius and poor resilience. If terminating a single instance causes a 0.1% error rate, the system has a small blast radius and good resilience.

**Recovery time measurement.** After injecting a failure, measure how long it takes the system to recover. If the system recovers within seconds (through automated failover), the recovery time is excellent. If it takes minutes (requiring manual intervention), the recovery time needs improvement. If it takes hours (requiring a full rollback or disaster recovery), the recovery time is unacceptable.

A real resilience measurement example. A company ran 10 chaos experiments monthly and tracked their resilience score. Over six months, the score improved from 2.1 to 3.8. The improvement was driven by specific fixes identified through the experiments: adding circuit breakers for external dependencies, implementing automated failover for databases, adding redundancy for critical services, and improving monitoring and alerting. The resilience score provided objective evidence that the chaos engineering program was working and justified the continued investment.

The key insight is that resilience is not binary. It is a spectrum. Chaos engineering helps you measure where you are on that spectrum and track your progress as you improve. Without measurement, you are guessing. With measurement, you know.

## Common Chaos Engineering Mistakes

Chaos engineering is powerful but can backfire if done incorrectly. Here are the most common mistakes teams make and how to avoid them.

**Injecting failures without monitoring.** The most dangerous mistake is injecting a failure and not monitoring the impact. If you inject a network partition and do not watch the dashboards, you will not know whether the system handled it gracefully or whether it caused a cascading failure. Always monitor the four golden signals during a chaos experiment and have automated abort criteria.

**Testing in production without safeguards.** Running chaos experiments in production without automated rollback, blast radius control, and time-boxing is reckless. Production chaos engineering requires rigorous safeguards. Start in staging, prove the experiment is safe, and then move to production with strict controls.

**Testing only happy paths.** Some teams run chaos experiments that test only the scenarios they expect the system to handle. This misses the point. The value of chaos engineering is discovering unexpected weaknesses. Design experiments that test failure modes you are not sure the system can handle.

**Not fixing the weaknesses you find.** Running chaos experiments that reveal weaknesses and then not fixing them is worse than not running experiments at all. It demoralizes the team ("we know it is broken and nobody cares") and creates a false sense of security ("we ran chaos experiments, so we must be resilient"). Every weakness identified by a chaos experiment must be tracked and fixed.

**Over-complicating experiments.** Simple experiments are better than complex ones. A simple experiment that terminates a single process and observes the system's response is more valuable than a complex experiment that simultaneously injects network latency, CPU exhaustion, and process crashes. Start simple and add complexity only when the simple experiments no longer reveal new weaknesses.

**Not communicating with the team.** Running chaos experiments without notifying the team creates false alarms and erodes trust. The team should know that an experiment is planned, what it will test, and when it will run. This prevents unnecessary panic and ensures that the team can observe the system's response.

A real chaos engineering mistake example. A team ran a chaos experiment that injected a 10-second delay into a critical database query. They did not set up monitoring before the experiment. The delay caused the application's connection pool to exhaust, which caused cascading failures in three dependent services. The experiment ran for 20 minutes before someone noticed the dashboards were red. By that time, the cascading failures had caused a customer-impacting outage. The post-mortem revealed that the experiment was not scoped correctly (it should have been limited to a single instance), there were no automated abort criteria, and the team was not monitoring during the experiment.

The lesson was learned the hard way. The team implemented strict experiment protocols: scope control, automated abort criteria, mandatory monitoring, and team notification. Subsequent experiments were conducted safely and provided valuable resilience insights.

## Assessment

**Lab 1: Chaos Experiment Design (60 minutes)**

You are given a microservice architecture with three services: API gateway, order service, and payment service. The order service depends on the payment service, and the API gateway depends on both.

Tasks:
1. Design a chaos experiment that tests the order service's resilience to payment service failures.
2. Define the steady-state hypothesis (what "normal" looks like).
3. Define the failure injection method (what failure to inject and how).
4. Define the abort criteria (when to stop the experiment).
5. Define the success criteria (what constitutes a resilient response).
6. Implement the experiment using Chaos Mesh or a similar tool.
7. Run the experiment in a staging environment and document the results.

Grading criteria:
- Experiment design is sound and tests a real failure mode (15 points)
- Steady-state hypothesis is measurable and specific (10 points)
- Failure injection is realistic and well-scoped (15 points)
- Abort criteria are clear and prevent cascading failures (10 points)
- Success criteria are specific and measurable (10 points)
- Implementation works correctly (20 points)
- Results are documented with findings (20 points)

**Lab 2: GameDay Planning (45 minutes)**

You are tasked with planning a GameDay exercise for your team. The scenario is: the primary database becomes unavailable, and all read operations must fail over to a read replica.

Tasks:
1. Design the GameDay scenario in detail (what happens, when, and how).
2. Define the roles and responsibilities for participants.
3. Create a timeline for the exercise (what happens at each time interval).
4. Define the observation criteria (what the organizers should be watching for).
5. Create a debrief template for the post-exercise review.
6. Identify at least 5 potential findings from the exercise.

Grading criteria:
- Scenario is realistic and complex enough to test multiple teams (20 points)
- Roles and responsibilities are clearly defined (15 points)
- Timeline is detailed and realistic (20 points)
- Observation criteria are specific and actionable (15 points)
- Debrief template is comprehensive (15 points)
- Potential findings are realistic and valuable (15 points)

**Lab 3: Failure Injection Implementation (90 minutes)**

You are given a web application with a Redis cache and a PostgreSQL database. Implement failure injection for three scenarios.

Tasks:
1. Inject Redis unavailability: simulate Redis being down for 60 seconds. Verify the application falls back to the database.
2. Inject database latency: add 2 seconds of latency to all database queries. Verify the application handles the latency gracefully.
3. Inject network partition: block all traffic between the application and the cache for 30 seconds. Verify the application continues to function.
4. For each scenario, implement automated abort criteria.
5. Document the results and identify any resilience gaps.

Grading criteria:
- Redis failure injection works correctly (20 points)
- Database latency injection works correctly (20 points)
- Network partition injection works correctly (20 points)
- Automated abort criteria work correctly (15 points)
- Results are documented with findings (15 points)
- Resilience gaps are identified (10 points)
