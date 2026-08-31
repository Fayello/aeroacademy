# Module 3 — CI/CD Pipelines

## What CI/CD Actually Does

Continuous Integration and Continuous Delivery are not features you bolt onto a project. They are practices that fundamentally change how software gets built, tested, and shipped. The difference between a team with CI/CD and one without is the difference between a team that deploys on Friday afternoon without worry and a team that deploys on Friday afternoon with dread.

Continuous Integration means every code change gets merged into a shared branch and automatically built and tested. The build is automated, the tests are automated, and the feedback is fast. If the build breaks, the team knows within minutes, not days.

Continuous Delivery means every change that passes the pipeline is deployable to production. You can deploy at any time with a button click. The pipeline guarantees that if the code passes all stages, it is safe to deploy.

Continuous Deployment goes further: every change that passes the pipeline goes to production automatically. No button click. No human approval. The pipeline is the gatekeeper.

The pipeline is the sequence of stages that every code change goes through. A typical pipeline looks like this: lint → test → security scan → build → deploy to staging → smoke test → deploy to production. Each stage acts as a quality gate. If a stage fails, the pipeline stops and the team is notified.

## GitHub Actions Workflow YAML

GitHub Actions is the CI/CD platform built into GitHub. It uses YAML files stored in `.github/workflows/` to define pipelines. Here is a complete, real-world workflow for a Node.js application with PostgreSQL:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check formatting with Prettier
        run: npm run format:check

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://test:testpass@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:testpass@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'HIGH,CRITICAL'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster staging-cluster \
            --service my-app \
            --force-new-deployment

      - name: Wait for deployment to stabilize
        run: |
          aws ecs wait services-stable \
            --cluster staging-cluster \
            --services my-app

      - name: Run smoke tests
        run: |
          sleep 30
          for endpoint in /health /api/status /api/users; do
            response=$(curl -s -o /dev/null -w "%{http_code}" "https://staging.example.com$endpoint")
            if [ "$response" != "200" ]; then
              echo "Smoke test failed for $endpoint: HTTP $response"
              exit 1
            fi
          done
          echo "All smoke tests passed"

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster production-cluster \
            --service my-app \
            --force-new-deployment

      - name: Wait for deployment to stabilize
        run: |
          aws ecs wait services-stable \
            --cluster production-cluster \
            --services my-app

      - name: Verify deployment
        run: |
          sleep 30
          for endpoint in /health /api/status; do
            response=$(curl -s -o /dev/null -w "%{http_code}" "https://example.com$endpoint")
            if [ "$response" != "200" ]; then
              echo "Production verification failed for $endpoint: HTTP $response"
              exit 1
            fi
          done
          echo "Production verification passed"
```

This pipeline has seven stages: lint, test, security, build, deploy to staging, smoke test, and deploy to production. Lint runs first because it is fast (seconds). Test and security run in parallel after lint passes. Build only runs on the `main` branch (pull requests get linted, tested, and scanned but not built). Staging deployment happens automatically after build. Production deployment happens automatically after staging passes.

The `environment: production` setting can require manual approval in GitHub repository settings. This converts the pipeline from Continuous Deployment to Continuous Delivery for production while keeping staging fully automated.

## Pipeline Stages in Detail

### Lint Stage

Linting catches style issues, potential bugs, and code quality problems before they reach testing. Linting is fast (seconds) and should be the first stage. If linting fails, there is no point running tests.

A good lint stage runs multiple tools:

```yaml
lint:
  steps:
    - run: npm run lint          # Code style and potential bugs
    - run: npm run format:check  # Code formatting
    - run: npx tsc --noEmit      # Type checking
    - run: npm audit --audit-level=high  # Dependency vulnerabilities
```

The key is speed. Each lint tool should complete in under 30 seconds. If a lint tool takes minutes, configure it to only check changed files, not the entire codebase.

### Test Stage

Testing is where most pipelines spend the most time. The goal is to catch bugs without making the pipeline unbearably slow.

**Unit tests** are fast and should run first. They test individual functions and classes in isolation. A unit test suite should complete in under 2 minutes.

**Integration tests** are slower and test interactions between components. They often require databases, message queues, or external services. Use service containers (as shown in the GitHub Actions example) to spin up real dependencies.

**End-to-end tests** are the slowest and test the entire application from the user's perspective. They are valuable but expensive. Run them only on the main branch, not on every pull request.

The testing pyramid guides the balance: many unit tests (fast, cheap), fewer integration tests (moderate speed, moderate cost), few end-to-end tests (slow, expensive). If you have 100 unit tests, 20 integration tests, and 5 end-to-end tests, that is a reasonable distribution.

### Security Stage

Security scanning should run on every commit. There are three types:

**Dependency scanning** checks your dependencies for known vulnerabilities. `npm audit`, `pip-audit`, `bundler-audit` are tools for this. They compare your dependency versions against vulnerability databases.

**Static Application Security Testing (SAST)** analyzes your code for security patterns. Tools like Semgrep, CodeQL, and Bandit scan for common vulnerabilities: SQL injection, XSS, hardcoded secrets, insecure crypto.

**Container scanning** checks Docker images for vulnerabilities. Trivy, Grype, and Snyk scan the image layers for known CVEs.

Running all three on every commit ensures that security issues are caught before they reach production. The cost is additional pipeline time (usually 1-3 minutes), which is far less than the cost of a production security incident.

### Build Stage

The build stage creates deployable artifacts. For Docker-based applications, this means building and pushing a Docker image. For compiled languages, this means compiling and packaging.

Build optimization is critical because slow builds waste developer time. Key techniques:

**Layer caching** — Docker caches each layer. Put frequently changing layers (application code) after infrequently changing layers (base image, dependencies). This means dependency installation is cached and only application code is rebuilt.

```dockerfile
# Bad: dependencies rebuilt on every code change
COPY . /app
RUN npm install

# Good: dependencies cached when code changes
COPY package*.json /app/
RUN npm ci --only=production
COPY . /app
```

**Parallel builds** — If your build has independent components, build them in parallel. GitHub Actions allows parallel jobs. Use `needs: [job1, job2]` to run a job after multiple jobs complete.

**Build caches** — Use GitHub Actions cache, Docker BuildKit cache, or language-specific caches to avoid rebuilding from scratch. The `cache-from` and `cache-to` options in the Docker build action enable BuildKit caching.

### Deploy Stage

Deployment should be boring. If deploying is exciting, something is wrong. The deployment process should be the same every time, regardless of what changed.

Common deployment strategies:

**Rolling deployment** — Gradually replace old instances with new ones. The application runs both old and new versions simultaneously during deployment. This is the default strategy for most platforms.

**Blue-green deployment** — Deploy the new version to a separate environment, switch traffic, then tear down the old version. This allows instant rollback by switching traffic back.

**Canary deployment** — Deploy to a small subset of users first, monitor for errors, then gradually expand. This limits the blast radius of bad deployments.

**Recreate deployment** — Stop all old instances, deploy new ones. This causes downtime and should only be used when the application cannot run multiple versions simultaneously (usually due to database schema changes).

The choice depends on your application's requirements. Most web applications support rolling or blue-green deployments. Canary deployments are valuable for high-traffic applications where even a small percentage of errors affects many users.

## Parallel vs Sequential Jobs

The order of pipeline stages affects total execution time. Running jobs in parallel reduces wall-clock time but may increase resource usage.

**Sequential example:**
```yaml
jobs:
  lint:
    # 30 seconds
  test:
    needs: lint
    # 2 minutes
  build:
    needs: test
    # 3 minutes
# Total: 5 minutes 30 seconds
```

**Parallel example:**
```yaml
jobs:
  lint:
    # 30 seconds
  test:
    needs: lint
    # 2 minutes
  security:
    needs: lint
    # 1 minute
  build:
    needs: [test, security]
    # 3 minutes
# Total: 5 minutes 30 seconds (but test and security run concurrently)
```

In the parallel example, test and security run simultaneously. The total time is the same because build waits for both, but the developer gets feedback faster because security results appear while tests are still running.

The optimal strategy depends on your pipeline. If security scanning is slow, parallelize it with testing. If building is slow, parallelize independent build steps. The goal is to reduce the critical path — the longest sequence of dependent jobs.

## Environment-Specific Deployments

Different environments have different configurations. Development, staging, and production should have separate settings, credentials, and infrastructure.

GitHub Environments provide this separation:

```yaml
deploy-staging:
  environment: staging
  steps:
    - run: |
        echo "Deploying to ${{ vars.STAGING_URL }}"
        echo "Using database ${{ secrets.STAGING_DB_URL }}"

deploy-production:
  environment: production
  steps:
    - run: |
        echo "Deploying to ${{ vars.PRODUCTION_URL }}"
        echo "Using database ${{ secrets.PRODUCTION_DB_URL }}"
```

Each environment has its own variables and secrets. Staging secrets are different from production secrets. This prevents accidental deployment of staging configurations to production.

The `environment` setting also enables protection rules: required reviewers, wait timers, and deployment branches. For production, you might require two reviewers and a 5-minute wait timer. For staging, you might require no reviewers and no wait timer.

## Rollback Mechanisms

When a deployment goes wrong, you need to roll back fast. The rollback process should be as automated as the deployment process.

For Docker-based deployments, rolling back means deploying the previous image tag:

```yaml
rollback:
  name: Rollback Production
  runs-on: ubuntu-latest
  if: failure()
  steps:
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Get previous task definition
      run: |
        PREV_TD=$(aws ecs describe-services \
          --cluster production-cluster \
          --services my-app \
          --query 'services[0].deployments[1].taskDefinition' \
          --output text)
        echo "PREVIOUS_TASK_DEF=$PREV_TD" >> $GITHUB_ENV

    - name: Update service to previous task definition
      run: |
        aws ecs update-service \
          --cluster production-cluster \
          --service my-app \
          --task-definition ${{ env.PREVIOUS_TASK_DEF }} \
          --force-new-deployment
```

For Kubernetes, rolling back is even simpler:

```bash
kubectl rollout undo deployment/my-app -n production
```

The key is that rollback should be one command, not a 30-minute manual process. If your rollback requires SSHing into servers, manually copying files, and restarting services, you have a problem. Automate rollback before you need it.

## Pipeline Anti-Patterns

### Slow Tests

If your test suite takes more than 10 minutes, developers stop waiting for it. They push code, start a new task, and check the results later. This defeats the purpose of CI.

**Fix:** Parallelize tests. Split your test suite across multiple CI jobs. Use test sharding to distribute tests evenly. If you have 1000 tests and 10 parallel jobs, each job runs 100 tests.

```yaml
test:
  strategy:
    matrix:
      shard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  steps:
    - run: npm run test -- --shard=${{ matrix.shard }}/10
```

### No Caching

If your pipeline installs dependencies from scratch every run, you are wasting time. npm install, pip install, and bundle install are slow. Cache the results.

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

GitHub Actions caches the npm global cache directory. The first run installs from the network. Subsequent runs install from cache. This can save minutes per run.

### Manual Gates

Manual approval steps before production deployment are sometimes necessary for compliance, but they should be the exception, not the rule. If every deployment requires a human to click a button, you have a bottleneck.

**Fix:** Automate everything. Use automated testing, automated security scanning, and automated canary analysis as gates instead of human approval. Reserve manual gates for regulatory requirements or extremely high-risk changes.

### No Rollback Plan

Deploying without a rollback plan is like skydiving without a parachute. You might be fine, but when you are not, you are really not.

**Fix:** Every deployment should have a documented and tested rollback procedure. The rollback should be a single command or a one-click operation. Test your rollback process regularly — it is not enough to have one if it does not work.

### Treating CI as a Testing Platform

CI is not just a place to run tests. It is a quality gate for the entire codebase. If your pipeline only runs tests, you are missing linting, security scanning, code coverage, and deployment verification.

**Fix:** Expand your pipeline to cover the full quality spectrum. Lint, test, security scan, build, deploy, verify. Each stage catches different problems. Skipping a stage means problems slip through.

## Real Story: Building a Pipeline That Deploys in Under 5 Minutes

A startup was building a real-time collaboration tool. The product team needed to ship features fast because they were competing with established players. Their initial pipeline took 45 minutes: 5 minutes to install dependencies, 10 minutes to build, 15 minutes to test, and 15 minutes to deploy. Developers were making 2-3 commits per day because each commit triggered a 45-minute wait.

The team analyzed the pipeline and identified the bottlenecks:

1. **Dependency installation: 5 minutes.** Every run installed 800+ npm packages from scratch.
2. **Build: 10 minutes.** The webpack build processed 500+ source files with no caching.
3. **Test: 15 minutes.** 2000 tests ran sequentially in a single job.
4. **Deploy: 15 minutes.** The deployment script SSHed into 8 servers, copied files, and restarted services.

The fix:

**Dependencies: 30 seconds.** They enabled npm caching in GitHub Actions. The first run installed from the network. Every subsequent run used the cached `node_modules`. They also switched from `npm install` to `npm ci`, which is faster because it skips dependency resolution (it uses the lockfile exactly).

**Build: 2 minutes.** They enabled Webpack's persistent caching and split the build into parallel chunks. Webpack's cache stores intermediate results, so only changed files are rebuilt. They also switched from JavaScript source maps (slow) to source map errors only (fast).

**Test: 4 minutes.** They split the test suite into 5 parallel jobs. Each job ran 400 tests instead of 2000. They also identified 500 slow tests (integration tests hitting a real database) and moved them to a separate suite that runs only on the main branch, not on every pull request.

**Deploy: 30 seconds.** They switched from SSH-based deployment to Docker images on ECS. Building the Docker image was part of the build stage. Deploying meant updating the ECS service to use the new image tag. ECS handled the rolling deployment automatically.

The result: pipeline execution time dropped from 45 minutes to 7 minutes. Developer productivity doubled because they could make more commits per day without context-switching. The team later optimized further to get deployment under 5 minutes by pre-building Docker images on feature branches and only running smoke tests on the main branch.

The key insight was that pipeline optimization is not about one big change — it is about many small improvements that compound. Caching saves minutes. Parallelization saves minutes. Each optimization is modest, but together they transform the developer experience.

The team also learned that pipeline optimization is an ongoing process, not a one-time project. As the codebase grew, new bottlenecks appeared. They added pipeline metrics to track execution time per stage, and when a stage exceeded its budget, they investigated and optimized. The pipeline became a first-class artifact — version controlled, tested, and continuously improved just like application code.

## Assessment

**Lab Task 1: Build a CI Pipeline (90 minutes)**

Create a GitHub Actions workflow for a sample application that includes:
1. Lint stage with at least 2 linting tools
2. Unit test stage with code coverage reporting
3. Security scanning stage (at least dependency audit)
4. Docker image build stage
5. Caching for dependencies and build artifacts

The pipeline should complete in under 10 minutes. Document your optimization decisions.

Grading criteria: All stages present and working (40%), caching implemented correctly (20%), pipeline completes in under 10 minutes (20%), documentation of decisions (20%).

**Lab Task 2: Pipeline Optimization Challenge (60 minutes)**

You are given a repository with a deliberately slow CI pipeline (estimated 30+ minutes). Optimize it to complete in under 10 minutes. You can:
1. Add caching
2. Parallelize jobs
3. Split test suites
4. Optimize Docker builds
5. Remove unnecessary steps

Document the before/after timing and explain each optimization.

Grading criteria: Pipeline completes in under 10 minutes (30%), correct use of optimization techniques (30%), documentation of before/after metrics (20%), explanation of trade-offs (20%).

**Lab Task 3: Deployment Pipeline with Rollback (60 minutes)**

Create a deployment pipeline that:
1. Builds a Docker image and pushes to a registry
2. Deploys to a staging environment
3. Runs automated smoke tests
4. Deploys to production (with manual approval)
5. Includes an automatic rollback step if smoke tests fail

Use a sample application (a simple web server with a /health endpoint).

Grading criteria: All pipeline stages work correctly (40%), rollback mechanism functions (25%), manual approval configured (15%), smoke tests are meaningful (20%).

**Lab Task 4: Pipeline Anti-Pattern Remediation (45 minutes)**

Given a pipeline with 5 intentional anti-patterns (slow tests without parallelization, no caching, manual gates, no security scanning, no rollback), identify and fix each one. For each fix, explain:
- What the anti-pattern was
- Why it is a problem
- How your fix addresses it
- What trade-offs your fix introduces

Grading criteria: All 5 anti-patterns identified (25%), all 5 fixed correctly (40%), explanations are accurate (20%), trade-offs are acknowledged (15%).

## Evidence

GitHub Actions is the CI/CD platform used in the pipeline examples. The YAML syntax and configuration options are based on GitHub's official documentation. The workflow patterns (lint → test → security → build → deploy) are based on industry best practices and real-world production pipelines.

The pipeline optimization story is based on common patterns observed in organizations that adopt CI/CD. The specific optimizations (npm caching, test parallelization, Docker layer caching, BuildKit caching) are well-documented techniques with measurable impact. The 45-minute to 7-minute improvement is consistent with published case studies of pipeline optimization.

The deployment strategies (rolling, blue-green, canary, recreate) are documented in Kubernetes documentation, AWS ECS documentation, and the broader DevOps literature. The choice of strategy depends on application requirements, and the trade-offs between them are well-understood in the industry.

The anti-patterns described (slow tests, no caching, manual gates, no security scanning, no rollback) are commonly observed in organizations that are early in their CI/CD adoption journey. The fixes are based on established best practices from the DORA team's research and the broader DevOps community.