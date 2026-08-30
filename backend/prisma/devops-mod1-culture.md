# Module 1 — DevOps: What It Actually Means

**Course:** DevOps & Platform Engineering | **Path:** DevOps (1 of 10)

---

## What You'll Actually Do

You'll understand DevOps as a practice, not a job title. It's how teams ship software reliably, quickly, and repeatedly.

---

## DevOps Is a Culture

DevOps is not:
- A tool (Jenkins, Docker, Kubernetes)
- A team (the "DevOps team")
- A certification

DevOps is:
- Development and Operations working together
- Automating everything that can be automated
- Measuring everything that can be measured
- Sharing responsibility for the product

---

## The DevOps Loop

```text
Plan → Code → Build → Test → Release → Deploy → Operate → Monitor
  ↑                                                              |
  └──────────────────────────────────────────────────────────────┘
```

Every step feeds back to the previous one. Monitoring tells you what to build next. Operations tells you what to test.

---

## CI/CD — Continuous Integration / Continuous Delivery

**CI:** Every code change is automatically built and tested.
**CD:** Every tested change is automatically deployed.

```text
Developer pushes code → CI builds → Tests pass → CD deploys to staging → Manual approval → CD deploys to production
```

---

## Infrastructure as Code

```text
Traditional: Click through UI to create servers
DevOps: Write code to create servers

# Terraform
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  tags = { Name = "web-server" }
}
```

Version controlled, repeatable, reviewable, testable.

---

## Monitoring and Feedback

```text
You can't improve what you don't measure:
- Response time
- Error rate
- Deployment frequency
- Mean time to recovery (MTTR)
- Change failure rate
```

---

## Assessment

**Lab task (15 min):**

1. Explain the DevOps loop to a non-technical person
2. Identify where CI/CD fits in the loop
3. Explain why Infrastructure as Code matters
4. List 5 metrics a DevOps team should track

**Grading:**
- Loop explained: 25%
- CI/CD understood: 25%
- IaC explained: 25%
- Metrics listed: 25%

---

## Evidence

- **OutcomeEvidence:** `DEV-LO1 — DevOps Culture & Principles`
