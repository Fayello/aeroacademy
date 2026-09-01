# Module 4 — Change Management

## Why Changes Break Things

Every incident has a root cause, and that root cause is almost always a change. A code deploy. A configuration update. A database migration. A traffic shift. A certificate renewal. Changes are the primary source of outages. This is not because engineers are incompetent. It is because changes are inherently risky. You are modifying a system that was working, hoping it will still work after the modification. The more complex the system, the more ways a change can cause unexpected behavior.

Change management is the discipline of reducing the risk of changes without eliminating the ability to make changes. This is the fundamental tension in SRE: you need to ship changes to improve the system, but every change risks breaking the system. The goal is not to prevent all failures from changes. The goal is to detect failures quickly and recover quickly when a change causes problems.

There are several strategies for managing change risk. The most common are canary deployments, blue-green deployments, rollback strategies, and feature flags. Each addresses a different aspect of change risk, and most mature organizations use a combination of all four.

## Canary Deployments

A canary deployment is a technique for reducing the risk of deploying new code by gradually rolling it out to a small subset of users before exposing it to everyone. The name comes from the coal mining practice of using canaries to detect toxic gases. If the canary dies, the miners know the air is dangerous. If the canary survives, the air is safe. In software, the "canary" is a small percentage of your infrastructure or traffic that receives the new code. If it works correctly, you expand the deployment. If it fails, you roll back the canary without affecting the rest of the system.

The implementation of a canary deployment has several components.

**Traffic splitting.** You need a way to route a percentage of traffic to the new version. This is typically done at the load balancer or ingress layer. In Kubernetes, you can use Istio, Linkerd, or NGINX ingress with traffic splitting annotations. In AWS, you can use ALB weighted target groups or Route 53 weighted routing. The key is that the traffic split is controlled by configuration, not by deploying separate infrastructure.

**Health monitoring.** During a canary deployment, you need to monitor the canary closely. Track the four golden signals (latency, traffic, errors, saturation) for the canary and compare them to the baseline (old version). If the canary shows higher error rates, higher latency, or increased resource consumption, you need to decide whether to proceed or roll back.

**Automated rollback.** The most important component is automated rollback. If the canary exceeds a predefined error threshold, the deployment pipeline should automatically roll back without human intervention. This requires defining clear success criteria before the deployment starts. For example: "if the canary's error rate exceeds 0.1% for more than 5 minutes, roll back automatically."

Here is a concrete example of a canary deployment in practice. A payment service is being updated with a new version that changes the way transactions are validated. The deployment pipeline works as follows:

1. Deploy the new version to 5% of the pods in the Kubernetes cluster.
2. Wait 5 minutes for the pods to stabilize.
3. Compare the canary's error rate, p99 latency, and transaction success rate against the baseline.
4. If all metrics are within acceptable bounds, increase traffic to 25%.
5. Wait 10 minutes and re-evaluate.
6. If still healthy, increase to 50%, then 75%, then 100%.
7. At each step, if any metric exceeds the threshold, automatically roll back.

The thresholds for the payment service might be:
- Error rate: must not exceed 0.1% (baseline is typically 0.01%)
- p99 latency: must not exceed 500ms (baseline is typically 200ms)
- Transaction success rate: must not fall below 99.9%

The canary deployment took 45 minutes from start to full rollout. During that time, the maximum blast radius was 5% of traffic. If the new version had a critical bug, only 5% of users would have been affected, and the rollback would have taken less than a minute.

Canary deployments have several advantages. They provide early detection of problems. They limit the blast radius of failures. They give the team confidence in the change before committing fully. They also generate real production data about the new version's performance, which is more reliable than staging environment testing.

The main disadvantage is complexity. Canary deployments require sophisticated traffic splitting, monitoring, and automated rollback. They also require the team to define clear success criteria for each deployment, which takes discipline.

## Blue-Green Deployments

A blue-green deployment is a technique for reducing deployment risk by maintaining two identical production environments: blue (current) and green (new). When you deploy a change, you deploy it to the green environment. You test the green environment thoroughly. If it passes, you switch traffic from blue to green. If it fails, you switch traffic back to blue.

The implementation of blue-green deployments has several components.

**Two identical environments.** You need two production environments that are identical in every way: same infrastructure, same configuration, same data. The environments can be separate Kubernetes clusters, separate sets of virtual machines, or separate AWS accounts. The key is that they are isolated from each other so that a failure in one does not affect the other.

**Traffic switching.** You need a way to switch traffic between the two environments. This is typically done at the load balancer or DNS level. In AWS, you might use Route 53 to switch DNS records from the blue environment's load balancer to the green environment's load balancer. In Kubernetes, you might use Istio to switch traffic between two services.

**Data synchronization.** The most challenging aspect of blue-green deployments is data. Both environments need access to the same data. This is typically achieved with a shared database. When you deploy a schema migration, the migration must be backward-compatible so that both the old and new code can work with the updated schema. If the migration is not backward-compatible, you cannot do blue-green deployments.

Here is a concrete example. A SaaS platform is deploying a new version of its API. The blue environment is running v1. The green environment is being prepared with v2. The deployment process:

1. Deploy v2 to the green environment.
2. Run a comprehensive test suite against the green environment: unit tests, integration tests, and smoke tests.
3. If all tests pass, switch traffic from blue to green using DNS.
4. Monitor the green environment for 15 minutes. Check the four golden signals.
5. If the green environment is healthy, decommission the blue environment (keep it as a backup for 24 hours).
6. If the green environment has problems, switch traffic back to blue.

The key advantage of blue-green deployments is that rollback is instant. If the new version fails, you switch traffic back to the old version in seconds. There is no need to rebuild or redeploy the old version. It is already running and ready.

The main disadvantage is cost. You are running two production environments simultaneously, which doubles your infrastructure cost. This is often acceptable for critical services but prohibitive for less critical ones. Blue-green deployments also require careful data synchronization, which adds complexity.

## Rollback Strategies

Rollback is the ability to reverse a change quickly when it causes problems. A rollback strategy defines how you reverse changes, how quickly you can reverse them, and what state the system is in after the rollback.

There are several types of rollbacks.

**Code rollback** is the simplest type. You revert the code change and redeploy the previous version. In a containerized environment, this means updating the container image tag to the previous version. In a non-containerized environment, this means redeploying the previous code artifact. Code rollbacks are fast (minutes) but only work for code changes. They do not help with configuration changes, database migrations, or infrastructure changes.

**Configuration rollback** involves reverting configuration changes. This is trickier than code rollback because configuration is often stored in databases, configuration management systems, or environment variables. If the configuration change was stored in version control, you can revert the commit and reapply the previous configuration. If the configuration change was made directly in a database or console, you need to know what the previous value was and restore it.

**Database rollback** is the hardest type. Database schema changes are typically forward-only. You cannot easily undo a table rename, a column addition, or a data migration. The best practice is to make schema changes backward-compatible: add new columns without removing old ones, create new tables without dropping old ones, and migrate data incrementally. This way, you can roll back the code without rolling back the database. If you must roll back a database change, you need a migration rollback script that reverses the original migration.

**Infrastructure rollback** involves reverting infrastructure changes. This might mean rolling back a Terraform apply, reverting a Kubernetes manifest change, or restoring a previous configuration in a cloud provider. Infrastructure-as-code tools make this straightforward because the previous state is stored in version control.

The key principle of rollback strategy is that every change should be rolled back-able before it is deployed. If you cannot roll back a change, you should not deploy it. This means thinking about rollback before you implement the change, not after. For database migrations, this means writing forward and rollback migrations. For feature changes, this means using feature flags instead of code changes. For infrastructure changes, this means using infrastructure-as-code with version control.

Here is a real example of a failed rollback. A company deployed a database migration that renamed a column from `user_id` to `customer_id`. The code was updated to use the new column name. The migration ran successfully. But the code change had a bug: it was not using the new column name consistently. Some endpoints still referenced `user_id`. The service started failing. The team tried to roll back the code, but the database still had the renamed column. The rolled-back code was looking for `user_id` which no longer existed. The team had to roll back both the code and the database simultaneously, which required a custom rollback script that renamed the column back. The total downtime was 25 minutes.

The lesson: the database migration was not backward-compatible. The code should have been deployed first to handle both column names (old and new), then the migration should have run, then the code should have been cleaned up to use only the new name. This three-step approach is called a expand-and-contract migration and is the gold standard for database changes.

## Feature Flags

Feature flags are a technique for decoupling code deployment from feature release. Instead of deploying new code and immediately making it visible to users, you deploy the code with a flag that controls whether the feature is enabled. The feature is "behind the flag." You can deploy the code to production without anyone seeing the new feature. Then you can enable the flag for internal users, then for a percentage of users, then for everyone. If the feature causes problems, you can disable the flag without rolling back code.

Feature flags have several use cases.

**Safe feature release.** Deploy new features behind a flag. Enable the flag for internal testing. Then gradually enable it for production users. If the feature causes errors or performance issues, disable the flag. This is the most common use case.

**Kill switch.** Use a feature flag as a kill switch for a problematic feature. If a new recommendation algorithm is causing high latency, disable it instantly by flipping the flag. This is faster than a code rollback and does not require redeployment.

**A/B testing.** Use feature flags to enable different versions of a feature for different user segments. Show version A to 50% of users and version B to 50%. Measure which version performs better. This is the basis of data-driven feature development.

**Operational control.** Use feature flags to control operational behavior. A flag might control whether a service calls a new database or the old one. A flag might control whether a service uses a new caching strategy. This allows you to test operational changes without code changes.

Here is a concrete example of feature flags in practice. A social media platform is launching a new feed algorithm. The algorithm is implemented in the `FeedService`. The deployment process:

1. Deploy the new code with the flag `NEW_FEED_ALGORITHM` set to `false`.
2. Enable the flag for internal employees (0.1% of users). Monitor for bugs and performance issues.
3. If internal testing passes, enable the flag for 5% of users. Monitor for 24 hours.
4. If 5% looks good, enable for 25%, then 50%, then 100%.
5. After the flag is enabled for 100% of users for 2 weeks, remove the flag and the old code path.

During the rollout, the team noticed that the new algorithm was causing a 15% increase in p99 latency. They were able to immediately disable the flag for the 5% of users affected, investigate the performance issue, fix it, and re-enable the flag. Without feature flags, they would have needed to roll back the entire deployment, which would have been more disruptive.

Feature flags require infrastructure to manage them. You need a way to store flag values, a way to read them in your application, and a way to change them without redeployment. Common implementations include:

- **Database-backed flags:** Store flags in a database table. The application reads the flag value on each request or caches it for a short period. This is simple but requires a database query on each request.
- **File-based flags:** Store flags in a configuration file. The application reads the file on startup or when the file changes. This is simple but requires a process restart to change flags.
- **Dedicated feature flag services:** Use a service like LaunchDarkly, Split, or Flagsmith. These services provide a management UI, SDKs for multiple languages, and real-time flag updates. This is the most capable option but adds a dependency.

The main risk of feature flags is flag debt. Over time, teams accumulate hundreds of flags. Some are enabled, some are disabled, and nobody remembers what they do. This creates complexity and confusion. The best practice is to have a policy that every flag must have an expiration date. If a flag is not cleaned up within the agreed-upon time (e.g., 90 days after full rollout), it is automatically flagged for review.

## A Safe Production Deployment: A Complete Scenario

Let me walk through a complete scenario of a safe production deployment using all of these techniques. The scenario is a payment service at an e-commerce company. The change is a new payment validation logic that improves fraud detection.

**Pre-deployment phase (1 week before):**

1. The new validation logic is implemented behind a feature flag called `NEW_VALIDATION`.
2. The code is deployed to production with the flag disabled. No user impact.
3. The team writes database migration scripts for the new validation schema. Both forward and rollback migrations are prepared.
4. The team defines success criteria: error rate must not exceed 0.05%, p99 latency must not exceed 300ms, fraud detection accuracy must improve by at least 10%.
5. The team runs load tests against the staging environment with the flag enabled. Results are compared against the success criteria.
6. The team prepares a rollback plan: disable the flag, or if the flag is not sufficient, revert the code and run the rollback migration.

**Deployment phase (day of deployment):**

1. The database migration is run during a low-traffic window (2 AM). The migration is backward-compatible: it adds new columns without removing old ones.
2. The team verifies the migration completed successfully by running integrity checks.
3. The feature flag is enabled for internal employees (0.1% of traffic). The team monitors dashboards for 1 hour.
4. No issues detected. The flag is enabled for 5% of traffic (canary).
5. The team monitors the canary for 30 minutes. Error rate is 0.02%, p99 latency is 250ms. Both within bounds.
6. Traffic is increased to 25%. Monitor for 30 minutes. Still healthy.
7. Traffic is increased to 50%. Monitor for 30 minutes. Still healthy.
8. Traffic is increased to 100%. The feature is now live for all users.
9. The team continues monitoring for 24 hours. The fraud detection accuracy improvement is confirmed at 12%.

**Post-deployment phase (1 week after):**

1. The feature flag `NEW_VALIDATION` is marked for cleanup. A ticket is created to remove the flag and the old code path.
2. The old columns in the database are marked as deprecated. A ticket is created to remove them after the deprecation period.
3. A post-deployment review is conducted. The team documents what went well, what could be improved, and any issues encountered.
4. The team updates the deployment runbook with lessons learned.

**What could have gone wrong and how the team handled it:**

- **Scenario 1: The new validation logic has a bug.** The feature flag is disabled, reverting to the old logic. No code rollback needed. Users see no impact.
- **Scenario 2: The database migration fails.** The team runs the rollback migration. The code is not deployed yet (the flag is disabled). No user impact.
- **Scenario 3: The canary shows high error rates.** Traffic is switched back to the old version (flag disabled). The team investigates.
- **Scenario 4: The new validation logic causes high latency.** The feature flag is disabled. The team investigates and optimizes before re-enabling.

The total deployment took 3 hours from migration to full rollout. The maximum blast radius was 5% of traffic during the canary phase. The total risk was minimal because every step had a clear rollback path.

## Change Management Anti-Patterns

Understanding what not to do is as important as understanding what to do. Here are common change management anti-patterns.

**Big bang deployments.** Deploying everything at once to all users. This maximizes the blast radius. If something goes wrong, everyone is affected. The alternative is incremental deployments with canary or feature flag approaches.

**Deploying on Fridays.** Friday deployments are risky because the team is less available over the weekend. If something goes wrong, the on-call engineer may not have the context to handle it. The best practice is to deploy early in the week (Tuesday or Wednesday) so that the team is available to respond.

**No rollback plan.** Deploying without a clear plan for how to reverse the change. Every deployment should have a rollback plan that can be executed in under 5 minutes.

**Skipping the canary.** Deploying directly to 100% of traffic because "the staging tests passed." Staging environments do not replicate production traffic patterns, dependencies, or scale. The canary is the real test.

**Manual deployments.** Deploying by SSH-ing into servers and running commands. Manual deployments are error-prone, slow, and difficult to roll back. Every deployment should be automated through a CI/CD pipeline.

**Deploying during incidents.** Deploying changes while an incident is ongoing. This adds noise to the signal. If an incident occurs after a deployment, you cannot tell whether the incident is related to the deployment or to the original issue. Wait for the incident to be resolved before deploying.

**No monitoring during deployment.** Deploying without watching the dashboards. During a deployment, the team should be actively monitoring the four golden signals. If something goes wrong, they need to detect it immediately, not discover it from a customer complaint an hour later.

The common thread in all of these anti-patterns is a lack of discipline. Change management requires discipline: planning before deploying, monitoring during deploying, and verifying after deploying. The discipline is what makes changes safe.

## Assessment

**Lab 1: Canary Deployment Pipeline (90 minutes)**

You are given a simple web application deployed to Kubernetes. The application has a single endpoint that returns a JSON response. You need to build a canary deployment pipeline.

Tasks:
1. Create a deployment script that deploys the new version to 10% of pods.
2. Implement health checks that compare the canary's error rate against the baseline.
3. Build an automated rollback that triggers if the canary's error rate exceeds 0.5% for more than 2 minutes.
4. Implement traffic splitting using Kubernetes services or Istio.
5. Test the pipeline by deploying a version with a deliberate bug (e.g., return HTTP 500 50% of the time).
6. Document the entire pipeline and create a runbook for deploying with it.

Grading criteria:
- Deployment correctly targets 10% of pods (15 points)
- Health checks accurately compare canary and baseline metrics (20 points)
- Automated rollback triggers correctly and rolls back successfully (25 points)
- Traffic splitting works as expected (15 points)
- Bug deployment test demonstrates the rollback (15 points)
- Documentation and runbook are clear (10 points)

**Lab 2: Feature Flag Implementation (60 minutes)**

You are given a web application with a flag service. Implement feature flags for the application.

Tasks:
1. Implement a feature flag system with three flags: `NEW_UI`, `NEW_API`, and `NEW_CACHING`.
2. Create an admin UI that shows all flags and their current state (enabled/disabled).
3. Implement the ability to enable/disable flags without redeployment.
4. Implement percentage-based rollout: `NEW_UI` is enabled for 10% of users.
5. Implement user-based targeting: `NEW_API` is enabled for users with a specific header.
6. Test the system by enabling and disabling flags and verifying the application behavior changes.

Grading criteria:
- Flag system correctly controls feature visibility (20 points)
- Admin UI shows all flags and allows toggling (15 points)
- Flags can be changed without redeployment (15 points)
- Percentage-based rollout works correctly (20 points)
- User-based targeting works correctly (15 points)
- System handles edge cases (flag not found, invalid values) (15 points)

**Lab 3: Rollback Strategy Documentation (30 minutes)**

You are given a production deployment that includes a database migration, a code change, and a configuration change.

Tasks:
1. Design a rollback strategy for each component.
2. Determine the order of rollback (which component first, which last).
3. Estimate the rollback time for each component.
4. Identify any dependencies between the components that affect rollback order.
5. Write a rollback runbook that an on-call engineer can follow during an incident.

Grading criteria:
- Rollback strategy is correct for each component (30 points)
- Rollback order accounts for dependencies (25 points)
- Time estimates are reasonable (15 points)
- Runbook is clear and can be followed under pressure (30 points)
