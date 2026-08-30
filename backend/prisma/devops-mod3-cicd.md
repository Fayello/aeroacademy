# Module 3 — CI/CD Pipelines

**Course:** DevOps & Platform Engineering | **Path:** DevOps (3 of 10)

---

## What You'll Actually Do

You'll build a CI/CD pipeline that automatically tests, builds, and deploys code. Not manually — every push triggers the pipeline.

---

## What Is CI/CD?

```text
CI (Continuous Integration):
  Push code → Run tests → Build artifact → Store artifact

CD (Continuous Delivery):
  Artifact → Deploy to staging → Manual approval → Deploy to production

CD (Continuous Deployment):
  Artifact → Deploy to production automatically
```

---

## GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t myapp:${{ github.sha }} .
      - run: docker push myapp:${{ github.sha }}

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: kubectl set image deployment/myapp myapp=myapp:${{ github.sha }}
```

---

## Pipeline Stages

```text
1. Lint        — Code style checks
2. Test        — Unit tests, integration tests
3. Security    — SAST, dependency scanning
4. Build       — Compile, create artifacts
5. Deploy      — Push to staging/production
6. Verify      — Smoke tests, health checks
```

---

## Pipeline Anti-Patterns

```text
Bad: Tests take 2 hours → developers don't run them
Good: Tests take < 10 minutes → run on every push

Bad: Deploy manually once a month → big bang releases
Good: Deploy automatically on every merge → small, frequent releases

Bad: No rollback plan → broken production for hours
Good: Automated rollback → recovery in minutes
```

---

## Assessment

**Lab task (25 min):**

1. Create a GitHub Actions workflow for a Node.js app
2. Add test, build, and deploy stages
3. Add security scanning
4. Configure environment-specific deployments
5. Set up rollback mechanism

**Grading:**
- Workflow created: 20%
- Tests passing: 20%
- Build working: 15%
- Security scanning: 15%
- Deploy configured: 20%
- Rollback tested: 10%

---

## Evidence

- **OutcomeEvidence:** `DEV-LO3 — CI/CD Pipelines`
