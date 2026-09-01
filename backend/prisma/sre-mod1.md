# Module 1: SRE Fundamentals

## What Site Reliability Engineering Actually Is

Site Reliability Engineering is not a job title you slap on a sysadmin. It is a set of practices that apply software engineering discipline to operations problems. The core idea is simple: treat operations as a software problem. Instead of manually clicking through consoles, writing runbooks that nobody reads, and firefighting the same incidents every week, you write code that automates away the pain. You measure everything. You make data-driven decisions about reliability instead of arguing about feelings in status meetings.

The discipline emerged at Google in the early 2000s when they realized their operations team could not scale with the growth of their infrastructure. They had thousands of servers, hundreds of services, and a small team of humans who could not possibly keep up with manual intervention for every failure. The solution was to hire software engineers into operations roles and have them build the tooling, automation, and monitoring that would let a small team manage an enormous fleet. The original SRE team at Google had about seven people managing infrastructure that served billions of requests per day. That ratio of humans to systems only works if you automate relentlessly.

SRE is not about preventing all failures. That is impossible. It is about managing the risk of failure to an acceptable level. You decide how much unreliability your users can tolerate, you measure your actual reliability, and you use the gap between the two to guide your engineering work. If your users expect 99.9% uptime and you are delivering 99.95%, you have budget left over. You can spend that budget on risky changes, new features, or infrastructure modernization. If you are at 99.85%, you need to stop shipping features and fix reliability.

This is a fundamentally different mindset from traditional operations. Traditional ops says "keep the lights on at all costs." SRE says "decide what level of reliability is worth paying for, then optimize for that target." It acknowledges that perfection is not only impossible but also not economically desirable. Every additional nine of reliability costs exponentially more. Going from 99.9% to 99.99% might cost ten times more than going from 99% to 99.9%. Unless that additional nine generates proportional revenue or prevents proportional loss, it is a bad investment.

## The Error Budget

The error budget is the single most important concept in SRE. It is the inverse of your SLO (Service Level Objective). If your SLO is 99.9% availability, your error budget is 0.1% of total time. For a 30-day month, that is approximately 43.2 minutes of allowable downtime. Every minute your service is down, you consume part of that budget. Every minute it is up, you preserve it.

The error budget is not just a number. It is a decision-making framework. When the error budget is healthy, the team is free to take risks. Deploy new features, experiment with infrastructure changes, run chaos engineering exercises, migrate databases. The budget gives you permission to break things because you have room to recover. When the error budget is depleted, the team must stop all non-essential changes and focus exclusively on reliability improvements. No new feature deploys. No risky migrations. No experiments in production.

This creates a natural feedback loop. Product managers want features shipped. Engineers want reliability improved. The error budget arbitrates between these competing interests with data instead of politics. If the budget is full, product wins. If the budget is empty, reliability wins. Nobody has to argue. The numbers decide.

Here is a real example of how this works in practice. At a fintech startup I worked with, the payment processing service had an SLO of 99.95%. That gave them roughly 22 minutes of downtime per month. In January, a series of database connection pool exhaustion incidents consumed about 18 minutes of budget. With only 4 minutes remaining, the team froze all feature work. They spent two weeks investigating the connection pool issue, implemented connection pooling with automatic recycling, added circuit breakers, and improved their connection timeout handling. By the end of February, the error budget was back to a healthy state and feature development resumed.

Without the error budget framework, that same team would have been stuck in a perpetual argument. Product would push for features. Engineering would push back citing reliability concerns. Neither side would have objective data to support their position. The error budget removed the argument and replaced it with a clear signal: we cannot afford to take risks right now, and here is exactly how much risk we can afford.

The error budget also changes how teams think about post-mortems. When an incident occurs, the first question is not "whose fault is this?" but "how much error budget did this consume?" An incident that consumed 5 minutes of a 43-minute budget is annoying. An incident that consumed 40 minutes is catastrophic. The severity is determined by impact on the error budget, not by how loud someone shouted in the Slack channel.

## The Four Golden Signals

The four golden signals are latency, traffic, errors, and saturation. They were defined by Google's SRE team as the four most important things to measure about any service. If you measure nothing else, measure these four.

**Latency** is the time it takes to service a request. You need to measure this at the service level, not the network level. Network latency between two data centers is irrelevant if the service processing the request is slow. Measure the time from when a request arrives to when a response is sent. Track this for both successful requests and failed requests separately. A slow successful request tells you about performance degradation. A slow failed request tells you about a different problem, perhaps a timeout or a resource exhaustion issue.

For a web service, you might measure p50 (median), p95, and p99 latency. The p50 tells you what the typical user experiences. The p95 tells you what a small but significant portion of users experience. The p99 tells you about the worst-case experience. If your p50 is 50ms but your p99 is 2000ms, 1% of your users are having a terrible experience even though the median looks fine. This is why percentiles matter more than averages. An average of 100ms could mean everything is 100ms, or it could mean half the requests are 10ms and half are 190ms. The average hides the distribution.

**Traffic** is the demand placed on your system. For a web service, this might be requests per second. For a database, it might be queries per second. For a video streaming service, it might be concurrent streams or bits per second. Traffic is your primary input signal. It tells you how much work your system is doing. Correlating traffic with latency and errors tells you whether your system is handling load gracefully or falling over under pressure.

A real-world example: a SaaS company noticed their p99 latency creeping up from 200ms to 500ms over the course of a month. Traffic had increased by 15% during the same period. Without measuring both signals, they might have assumed the latency increase was a code regression. In reality, they were approaching a capacity limit on their read replica. The additional 15% traffic had pushed them past the point where the replica could handle query volume efficiently. Adding another read replica resolved the latency issue. Without the traffic signal, they would have wasted weeks hunting for a code bug that did not exist.

**Errors** are the rate of failed requests. A failed request is not just an HTTP 500. It is any request that does not produce the expected result. A 200 OK response that returns incorrect data is an error. A request that succeeds but takes 30 seconds when it should take 200ms is arguably an error. You need to define what "error" means for your specific service and measure it precisely.

There are two types of errors to track: explicit failures and implicit failures. Explicit failures are things like HTTP 500 errors, exceptions, timeouts, and connection refused messages. Implicit failures are responses that technically succeed but produce wrong results, incomplete data, or degraded output. Both matter. Measuring only explicit failures gives you a false sense of security.

**Saturation** is how full your service is. It measures resource utilization: CPU, memory, disk, network, thread pools, connection pools, queue depths. Saturation is the leading indicator of future problems. If your CPU is at 80%, you have headroom. If it is at 95%, you are one traffic spike away from degraded performance. If it is at 100%, you are already in trouble.

The key insight about saturation is that it should be measured relative to your SLO. If your SLO requires p99 latency under 200ms, and your CPU hits 70% when p99 latency reaches 200ms, then 70% CPU is effectively 100% saturation for your service. The absolute number does not matter. What matters is the relationship between resource utilization and your reliability target.

These four signals are not independent. They interact with each other in predictable ways. Increasing traffic causes increasing saturation, which causes increasing latency, which causes increasing errors. By measuring all four simultaneously, you can trace the causal chain of any incident. The dashboard that shows all four signals together is often called a golden signals dashboard, and it should be the first thing any on-call engineer looks at when they get paged.

## Toil: The Hidden Tax

Toil is manual, repetitive, automatable work that provides no lasting value. It is the stuff you do over and over again that a script could do better. Restarting a service after a crash. Manually provisioning a server. Copying configuration from one environment to another. Running a database migration by SSH-ing into a box and executing SQL. triaging the same alert that fires every Monday morning because a cron job fails.

Toil is not the same as operational work. Operational work includes things like capacity planning, incident response, code review, and architecture design. These are cognitively demanding, varied, and contribute to the long-term health of the system. Toil is the opposite: mindless, repetitive, and provides no lasting improvement. Every hour spent on toil is an hour not spent on engineering work that improves the system.

Google's SRE book defines toil with several specific criteria. It is manual. It is repetitive. It is automatable. It is reactive, not proactive. It has no enduring value. It scales linearly with service growth. That last point is critical. If your toil grows as your service grows, you are on a treadmill that gets faster as you get more successful. At some point, the toil overwhelms the team and you cannot do any engineering work because you spend all your time on operational tasks.

Here is how to identify toil in your organization. Look at your ticket queue. If the same type of ticket appears more than three times per month, it is probably toil. Look at your on-call runbooks. If a runbook says "log into server X and run command Y," that is toil. Look at your Slack channels. If someone asks "how do I do X?" and the answer is a sequence of manual steps, that is toil. Look at your deployment process. If deploying code requires more than three manual steps, that is toil.

Measuring toil is straightforward. Track how many hours per week each engineer spends on manual, repetitive tasks. Add up the hours. That is your toil cost. At one startup I worked with, we measured toil and found that engineers were spending 60% of their time on toil. That meant only 40% of engineering time went to building new features, improving reliability, or reducing technical debt. The toil was consuming more than half the team's capacity.

The fix was not to hire more people. Adding headcount to deal with toil is like bailing water out of a sinking boat instead of plugging the hole. The fix was to automate. We built a deployment pipeline that eliminated manual steps. We created self-service infrastructure provisioning. We wrote alerting rules that auto-resolved common issues. We built a chatbot that handled common operational requests. Within six months, toil dropped from 60% to 15% of engineering time. That freed up 45% of the team's capacity for engineering work. The return on investment was enormous.

Toil reduction is not a one-time project. It is an ongoing discipline. As your service evolves, new toil will emerge. New types of tickets will appear. New manual processes will develop. You need to continuously identify and eliminate toil. A useful practice is to include toil measurement in your sprint planning. Every sprint, ask "how much toil did we eliminate this sprint?" If the answer is "none," you have a problem.

## Real Story: Adopting SRE at a Startup

CloudWave was a Series B startup with 40 engineers, a SaaS platform serving 2,000 customers, and a reliability problem. Their platform had an implicit SLO of "it should work most of the time." The engineering team shipped features aggressively but had no systematic approach to reliability. Incidents were frequent, post-mortems were rare, and the on-call rotation was a nightmare. Engineers dreaded being on call because they had no monitoring, no runbooks, and no playbooks. When something broke, they figured it out from scratch every time.

The CTO hired an SRE lead, Maya, who had worked at a mid-size company that had implemented SRE practices. Maya's mandate was simple: make the platform reliable without slowing down feature development. She started by establishing the four golden signals for the three most critical services: the API gateway, the payment processor, and the notification service.

The first step was measurement. Maya instrumented the services with latency histograms, error counters, traffic metrics, and saturation gauges. She set up dashboards in Grafana that showed all four signals for each service. Within two weeks, the team had visibility into their system for the first time. What they found was alarming. The API gateway had a p99 latency of 4.2 seconds. The payment processor had a 3.2% error rate. The notification service dropped 8% of messages during peak hours.

Armed with data, Maya proposed SLOs. She started conservatively. API gateway: 99.9% availability, p99 latency under 1 second. Payment processor: 99.99% availability (because it handled money). Notification service: 99.5% availability (because dropped notifications were annoying but not catastrophic). The error budgets were calculated: the API gateway had about 43 minutes per month, the payment processor had about 4.3 minutes, and the notification service had about 3.6 hours.

The error budget for the payment processor was immediately problematic. With a 3.2% error rate, they were blowing through 4.3 minutes of budget in hours, not days. The team had to stop shipping features to the payment processor and focus entirely on reliability. They discovered that the payment processor was failing because it was making synchronous calls to a third-party payment gateway with no retry logic and no circuit breaker. When the third-party gateway slowed down, the payment processor's thread pool exhausted, causing cascading failures.

The fix took three weeks. They implemented async payment processing with a message queue, added retry logic with exponential backoff, built a circuit breaker that fell back to a queued retry when the third-party gateway was slow, and added connection pooling. The payment processor's error rate dropped from 3.2% to 0.02%. Its error budget went from deeply negative to comfortably positive.

The notification service had a different problem. It was dropping messages during peak hours because its message queue was filling up. The queue was sized for the average traffic volume, not peak traffic. During morning hours when users logged in and triggered notifications, the queue overflowed. The fix was to increase the queue capacity, add backpressure handling, and implement rate limiting on notification producers. The message drop rate went from 8% to 0.1%.

The API gateway latency problem was caused by a single slow dependency. One internal service was responding slowly, and the API gateway was making synchronous calls to it. The fix was to implement a timeout and circuit breaker on that specific dependency, plus caching for the data it returned. p99 latency dropped from 4.2 seconds to 800ms.

Over six months, CloudWave's platform reliability went from "it works most of the time" to consistently meeting all three SLOs. The error budget framework gave the team a clear signal for when to focus on features versus reliability. Post-mortems became regular events. The on-call rotation went from dreaded to manageable because engineers now had dashboards, runbooks, and automated remediation for common issues.

The key lesson from CloudWave's adoption of SRE was that it did not require a massive organizational overhaul. It started with measurement, moved to SLO definition, and then used the error budget to prioritize work. The tools were simple: Prometheus for metrics, Grafana for dashboards, PagerDuty for alerting, and a wiki for runbooks. The hard part was not the technology. It was the cultural shift from "ship features at all costs" to "ship features at a rate the system can sustain."

## Putting It Together

SRE is a set of practices, not a destination. You do not "achieve SRE" and stop. You continuously apply the principles: measure your system, define your reliability targets, manage your error budget, reduce your toil, and improve continuously.

The starting point for any team adopting SRE is always the same: measure. You cannot improve what you cannot measure. Set up monitoring for the four golden signals. Build dashboards. Define SLOs. Calculate error budgets. Then use the error budget to guide your decisions.

The hardest part is not the technical implementation. It is the cultural change. SRE requires honesty about your system's limitations. It requires discipline to stop feature work when the error budget is depleted. It requires humility to conduct blameless post-mortems and admit that the system failed. It requires patience to invest in automation that pays off over months, not days.

But the payoff is enormous. Teams that adopt SRE practices consistently report fewer incidents, faster recovery times, higher engineer satisfaction, and more predictable feature delivery. The error budget removes the anxiety of "is it okay to deploy?" It replaces it with a clear, data-driven answer. The four golden signals replace gut feelings about system health with concrete metrics. Toil reduction frees engineers to do the work they were hired to do.

SRE is not a silver bullet. It will not fix a broken architecture, a toxic culture, or an understaffed team. But it provides a framework for systematically improving reliability, reducing operational burden, and making better decisions about how to invest engineering time. For teams willing to commit to the practices, it transforms how they build and operate software.

## Assessment

**Lab 1: Instrument a Service with Golden Signals (45 minutes)**

You are given a simple web application (Node.js or Python) that serves an API. The application has three endpoints: `/users` (fast, database query), `/reports` (slow, generates PDF), and `/health` (trivial).

Tasks:
1. Add latency measurement to all three endpoints. Record p50, p95, and p99 latencies over a 5-minute test window.
2. Add error counting. Simulate errors by introducing a failure in the `/reports` endpoint (e.g., throw an exception 10% of the time).
3. Add traffic measurement. Count requests per second for each endpoint.
4. Add saturation measurement. Monitor CPU and memory usage during a load test.
5. Build a Grafana dashboard showing all four golden signals.
6. Run a load test that pushes the `/reports` endpoint to 100% CPU. Document the latency degradation pattern.

Grading criteria:
- All four golden signals present and accurate (30 points)
- Dashboard shows all signals in a single view (20 points)
- Load test demonstrates saturation-latency correlation (20 points)
- Percentiles are correctly calculated (not averages) (15 points)
- Clean, well-structured code (15 points)

**Lab 2: Define SLOs and Calculate Error Budgets (30 minutes)**

You are given a production monitoring dashboard for an e-commerce platform with five services: web frontend, API gateway, product catalog, shopping cart, and order processing.

Tasks:
1. Review the existing metrics for each service over the past 30 days.
2. Propose SLOs for each service. Justify each SLO based on the service's business criticality.
3. Calculate the error budget for each SLO in minutes per month.
4. Determine which services have exhausted their error budget and which have headroom.
5. Write a prioritized action plan: which services need reliability work first?

Grading criteria:
- SLOs are realistic and justified (30 points)
- Error budget calculations are correct (25 points)
- Prioritization logic is sound (25 points)
- Documentation is clear and professional (20 points)

**Lab 3: Toil Identification Exercise (20 minutes)**

You are given a list of 20 operational tasks performed by an SRE team. Classify each as toil or engineering work and justify your classification.

Examples:
- "Restart the API server when it runs out of memory" (toil or engineering?)
- "Design a new caching strategy for the product catalog" (toil or engineering?)
- "Manually update TLS certificates on 15 servers" (toil or engineering?)
- "Conduct a capacity planning review for Q4 traffic" (toil or engineering?)

Grading criteria:
- Correct classification of at least 18/20 tasks (40 points)
- Justifications demonstrate understanding of toil criteria (40 points)
- Identifies which toil tasks are automatable and proposes automation approaches (20 points)
